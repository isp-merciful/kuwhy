import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '../../../../lib/prisma';
import { encode as encodeJwt } from 'next-auth/jwt';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { SignJWT } from 'jose';

export const runtime = 'nodejs';
const SECRET_BYTES = new TextEncoder().encode((process.env.NEXTAUTH_SECRET || '').trim());

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  'http://localhost:8000';

async function ensureUsersRowFromNextAuthUser(user) {
  if (!user?.id) return;
  const emailLocal = user.email?.split('@')?.[0];
  const fallbackLoginName = (emailLocal || `user_${String(user.id).slice(0, 8)}`)?.toLowerCase();

  const exists = await prisma.users.findUnique({ where: { user_id: user.id } });
  if (!exists) {
    await prisma.users.create({
      data: {
        user_id: user.id,                        
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

function dicebearUrl(seed, size = 256, style = "thumbs") {
  const params = new URLSearchParams({
    seed,
    size: String(size),
    radius: "50",
    backgroundType: "gradientLinear",
  });
  return `https://api.dicebear.com/9.x/${style}/png?${params.toString()}`;
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
          const emailFallback = null;

          const avatar = dicebearUrl(`u:${user_id}`, 256, "thumbs");

          const created = await prisma.$transaction(async (tx) => {
            const u = await tx.users.create({
              data: {
                user_id,
                login_name,
                user_name: user_name || 'anonymous',
                password: hash,
                gender: 'Not_Specified',
                img: avatar,
                role: 'member',
                email: emailFallback,
              },
            });
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

        const user = await prisma.users.findUnique({ where: { login_name } });
        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        const emailSafe = user.email || null;
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

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) token.id = user.id;

      if (trigger === 'update' && session) {
        if (session.image || session.img) {
          token.picture = session.image || session.img || token.picture;
        }
        if (session.name) {
          token.name = session.name;
        }
        if (session.login_name) {
          token.login_name = session.login_name;
        }
      }

      if (token?.id) {
        const u = await prisma.users.findUnique({
          where: { user_id: token.id },
          select: { role: true, login_name: true, user_name: true, img: true, email: true },
        });

        if (u) {
          token.role = u.role || token.role || 'anonymous';
          token.login_name = u.login_name ?? token.login_name ?? null;
          token.name = u.user_name || token.name;
          token.email = u.email || token.email;

          if (u.img) {
            if (
              u.img.startsWith('http://') ||
              u.img.startsWith('https://') ||
              u.img.startsWith('data:image')
            ) {
              token.picture = u.img;
            } else {
              token.picture = `${BACKEND_BASE}${u.img}`;
            }
          }
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
        session.user.img = token.picture || session.user.img;
        session.user.email = token.email || session.user.email;
      }

      if (token?.id) {
        const payload = {
          id: String(token.id),
          role: token.role || 'anonymous',
          login_name: token.login_name || null,
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
