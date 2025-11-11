// app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '../../../../lib/prisma';
import { encode as encodeJwt } from 'next-auth/jwt';
import bcrypt from 'bcrypt';
// import { dicebearUrl } from "../../../../lib/avatarUrl";
import { randomUUID } from 'crypto';
import { SignJWT } from 'jose';

export const runtime = 'nodejs';
const SECRET_BYTES = new TextEncoder().encode((process.env.NEXTAUTH_SECRET || '').trim());

async function ensureUsersRowFromNextAuthUser(user) {
  if (!user?.id) return;
  // สร้าง login_name fallback จากอีเมล (ถ้ามี)
  const emailLocal = user.email?.split('@')?.[0];
  const fallbackLoginName = (emailLocal || `user_${String(user.id).slice(0, 8)}`)?.toLowerCase();

  const exists = await prisma.users.findUnique({ where: { user_id: user.id } });
  if (!exists) {
    await prisma.users.create({
      data: {
        user_id: user.id,                         // ใช้ id ที่ adapter สร้างแล้ว (ตัวจริง)
        user_name: user.name ?? 'anonymous',
        login_name: fallbackLoginName,
        password: '',
        img: user.image ?? '/images/pfp.png',
        gender: 'Not_Specified',
        role: 'member',
        email: user.email ?? null,
      },
    });
  } else {
    await prisma.users.update({
      where: { user_id: user.id },
      data: {
        user_name: user.name ?? exists.user_name,
        img: user.image ?? exists.img,
        email: user.email ?? exists.email,
        role: exists.role === 'anonymous' ? 'member' : exists.role,
      },
    });
  }
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        login_name: { label: 'Username', type: 'text' },
        user_name: { label: 'Display name', type: 'text' },
        password: { label: 'Password', type: 'password' },
        isRegister: { label: 'isRegister', type: 'text' },
      },
      async authorize(credentials) {
        const isRegister = credentials?.isRegister === 'true';
        const login_name = (credentials?.login_name || '').trim().toLowerCase();
        const user_name = (credentials?.user_name || '').trim();
        const password = credentials?.password || '';
        if (!login_name || !password) return null;

        if (isRegister) {
          const dup = await prisma.users.findUnique({ where: { login_name } });
          if (dup) return null;

          const user_id = randomUUID();
          const hash = await bcrypt.hash(password, 10);
          const emailFallback = `${login_name}@local.invalid`;

          const created = await prisma.$transaction(async (tx) => {
            const u = await tx.users.create({
              data: {
                user_id,
                login_name,
                user_name: user_name || 'anonymous',
                password: hash,
                gender: 'Not_Specified',
                img: dicebearUrl(`user:${user.id}`, 256, "adventurer"),
                role: 'member',
                email: emailFallback,
              },
            });
            // sync ไปตาราง next-auth.User ให้ใช้ id เดียวกัน
            await tx.user.upsert({
              where: { id: u.user_id },
              update: { name: u.user_name, image: u.img, email: u.email },
              create: { id: u.user_id, name: u.user_name, image: u.img, email: u.email },
            });
            return u;
          });

          return {
            id: created.user_id,
            name: created.user_name,
            email: created.email,
            image: created.img,
            login_name: created.login_name,
            role: created.role,
          };
        }

        // LOGIN
        const user = await prisma.users.findUnique({ where: { login_name } });
        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        const emailSafe = user.email || `${user.login_name}@local.invalid`;
        await prisma.user.upsert({
          where: { id: user.user_id },
          update: { name: user.user_name, image: user.img ?? undefined, email: emailSafe },
          create: { id: user.user_id, name: user.user_name, image: user.img ?? null, email: emailSafe },
        });

        return {
          id: user.user_id,
          name: user.user_name ?? null,
          email: emailSafe,
          image: user.img ?? null,
          login_name: user.login_name,
          role: user.role,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  secret: process.env.NEXTAUTH_SECRET,

  // ❌ ไม่ต้อง ensure ใน signIn อีกต่อไป
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      if (token?.id) {
        const u = await prisma.users.findUnique({
          where: { user_id: token.id },
          select: { role: true, login_name: true, user_name: true, img: true, email: true },
        });
        if (u) {
          token.role = u.role || 'anonymous';
          token.login_name = u.login_name || null;
          token.name = u.user_name || token.name;
          token.picture = u.img || token.picture;
          token.email = u.email || token.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role || 'anonymous';
        session.user.login_name = token.login_name || null;
        session.user.name = token.name || session.user.name;
        session.user.image = token.picture || session.user.image;
        session.user.email = token.email || session.user.email;
      }
      // if (process.env.NEXTAUTH_SECRET && token?.id) {
      //   session.apiToken = await encodeJwt({
      //     token: { id: token.id, role: token.role || 'anonymous', login_name: token.login_name || null },
      //     secret: process.env.NEXTAUTH_SECRET,
      //     maxAge: 60 * 60 * 24 * 7,
      //   });
      // } else {
      //   session.apiToken = null;
      // }
          if (token?.id) {
      // 👉 ออกเป็น JWS 3 จุด (HS256) เสมอ — backend verify ได้ทันที
      const payload = {
        id: String(token.id),
        role: token.role || 'anonymous',
        login_name: token.login_name || null,
        // ใส่พวก name/image เฉพาะจำเป็นเท่านั้นก็พอ
      };
      session.apiToken = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(SECRET_BYTES);
    } else {
      session.apiToken = null;
    }
      return session;
    },
  },

  // ✅ ทำให้แน่ใจว่าเรา sync หลัง adapter สร้างผู้ใช้แล้ว
  events: {
    async createUser({ user }) {
      await ensureUsersRowFromNextAuthUser(user);
    },
    async linkAccount({ user }) {
      await ensureUsersRowFromNextAuthUser(user);
    },
  },

  pages: { signIn: '/login', error: '/login' },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
