// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../../lib/prisma"; // ⬅️ ปรับ path ให้ตรงโปรเจกต์
import bcrypt from "bcrypt";

export const runtime = "nodejs";

// สร้าง/ซิงก์แถวในตาราง users ให้มี user_id = user.id (ของ NextAuth) เสมอ
async function ensureUsersRowFromNextAuthUser(user) {
  if (!user?.id) return;

  const exists = await prisma.users.findUnique({ where: { user_id: user.id } });

  if (!exists) {
    await prisma.users.create({
      data: {
        user_id: user.id,
        login_name: user.email ?? `user_${user.id.slice(0, 8)}`,
        user_name: user.name ?? "anonymous",
        password: "", // Google ไม่มีรหัสผ่าน
        img: user.image ?? "/images/pfp.png",
        gender: "Not_Specified",
        role: "member", // Google ครั้งแรก → member
      },
    });
  } else if (exists.role === "anonymous") {
    // อัปเกรดจาก anonymous → member เมื่อมีการ sign-in จริง
    await prisma.users.update({
      where: { user_id: exists.user_id },
      data: { role: "member" },
    });
  }
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        login_name: { label: "Username", type: "text", placeholder: "your_username" },
        user_name: { label: "Display name", type: "text" }, // ใช้เฉพาะตอนสมัคร
        password: { label: "Password", type: "password" },
        isRegister: { label: "isRegister", type: "text" }, // 'true' | 'false'
      },
      async authorize(credentials) {
        const isRegister = credentials?.isRegister === "true";
        const login_name = (credentials?.login_name || "").trim();
        const user_name = (credentials?.user_name || "").trim();
        const password = credentials?.password || "";

        if (!login_name || !password) throw new Error("Missing credentials");

        if (isRegister) {
          // กันชื่อซ้ำ
          const dup = await prisma.users.findUnique({ where: { login_name } });
          if (dup) throw new Error("Username already exists");

          // hash
          const hash = await bcrypt.hash(password, 10);

          // gen user_id (ตารางคุณใช้ CHAR(36))
          const { randomUUID } = await import("crypto");
          const user_id = randomUUID();

          // สร้างในตาราง users (role = member)
          const created = await prisma.users.create({
            data: {
              user_id,
              login_name,
              user_name: user_name || "anonymous",
              password: hash,
              gender: "Not_Specified",
              img: "/images/pfp.png",
              role: "member",
            },
          });

          // ensure NextAuth.User (id เท่ากับ users.user_id)
          await prisma.user.upsert({
            where: { id: created.user_id },
            update: {
              name: created.user_name,
              image: created.img,
              email: `${created.login_name}@local.invalid`,
            },
            create: {
              id: created.user_id,
              name: created.user_name,
              image: created.img,
              email: `${created.login_name}@local.invalid`,
            },
          });

          // คืนข้อมูลสำหรับ JWT
          return {
            id: created.user_id,
            name: created.user_name,
            email: `${created.login_name}@local.invalid`,
            image: created.img,
            login_name: created.login_name,
            role: created.role,
          };
        }

        // ===== LOGIN =====
        const user = await prisma.users.findUnique({ where: { login_name } });
        if (!user || !user.password) throw new Error("Invalid username or password");

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new Error("Invalid username or password");

        // ensure NextAuth.User มี row คู่กัน (กรณี users มีอยู่ก่อน)
        await prisma.user.upsert({
          where: { id: user.user_id },
          update: {
            name: user.user_name,
            image: user.img ?? undefined,
            email: user.email ?? `${user.login_name}@local.invalid`,
          },
          create: {
            id: user.user_id,
            name: user.user_name,
            image: user.img ?? null,
            email: user.email ?? `${user.login_name}@local.invalid`,
          },
        });

        return {
          id: user.user_id,
          name: user.user_name ?? null,
          email: user.email ?? `${user.login_name}@local.invalid`,
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

  // ใช้ JWT เพื่อให้ middleware/บริการอื่นๆ ตรวจได้ง่าย
  session: { strategy: "jwt" },

  callbacks: {
    // เรียกทุกครั้งที่ sign-in (ทั้ง Google และ Credentials)
    async signIn({ user }) {
      try {
        await ensureUsersRowFromNextAuthUser(user);
      } catch (e) {
        console.error("ensureUsersRowFromNextAuthUser error:", e);
      }
      return true;
    },

    async jwt({ token, user }) {
      // ตอน sign-in จะมี user → อัดค่าลง token
      if (user) {
        token.id = user.id; // users.user_id / NextAuth.User.id
        token.login_name = user.login_name ?? token.login_name;
        token.name = user.name ?? token.name;
        token.picture = user.image ?? token.picture;
        token.role = user.role ?? token.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.login_name = token.login_name;
        session.user.name = token.name ?? session.user.name;
        session.user.image = token.picture ?? session.user.image;
        session.user.role = token.role || "member";
      }
      return session;
    },
  },

  // (เลือกใส่) ถ้ามีหน้า login ของคุณเองที่ /login
  // pages: { signIn: "/login" },
  pages: { signIn: "/login" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
