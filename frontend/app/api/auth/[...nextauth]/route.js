import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcrypt";

export const runtime = "nodejs";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // ✅ เพิ่ม CredentialsProvider
    Credentials({
      name: "Credentials",
      credentials: {
        login_name: { label: "login_name", type: "text" },
        user_name: { label: "user_name", type: "text" }, // ใช้เฉพาะ register
        password: { label: "password", type: "password" },
        isRegister: { label: "isRegister", type: "text" }, // 'true' | 'false'
      },
      async authorize(credentials) {
        const isRegister = credentials?.isRegister === "true";
        const login_name = (credentials?.login_name || "").trim();
        const user_name = (credentials?.user_name || "").trim();
        const password = credentials?.password || "";

        if (!login_name || !password) {
          throw new Error("Missing credentials");
        }

        // helper: ensure User (ของ NextAuth) มี record คู่กับ users.user_id
        async function upsertNextAuthUser({ user_id, name, image }) {
          // email ไม่จำเป็น (ปล่อย null ก็ได้) แต่บางระบบอยากให้ไม่เป็น null
          const pseudoEmail = `${login_name}@local.invalid`; // ไม่ถูกใช้ส่งเมล แค่กัน unique
          const ua = await prisma.user.upsert({
            where: { id: user_id },
            update: {
              name: name ?? undefined,
              image: image ?? undefined,
              // email ควรคงเดิมถ้ามีจาก Google แล้ว
            },
            create: {
              id: user_id,
              name: name || "anonymous",
              email: pseudoEmail,
              image: image || null,
            },
          });
          return ua;
        }

        if (isRegister) {
          // สมัครใหม่
          // ตรวจซ้ำ login_name
          const dup = await prisma.users.findFirst({ where: { login_name } });
          if (dup) {
            throw new Error("Username already exists");
          }

          // สร้าง user_id server-side
          const user_id =
            (globalThis.crypto?.randomUUID && crypto.randomUUID()) ||
            `${Date.now()}-${Math.random().toString(16).slice(2)}`;

          const hash = await bcrypt.hash(password, 10);

          const newUser = await prisma.users.create({
            data: {
              user_id,
              user_name: user_name || "anonymous",
              login_name,
              password: hash,
              gender: "Not_Specified",
              img: "/images/pfp.png",
            },
          });

          // ensure ผู้ใช้มีเรคคอร์ดในตาราง User (ของ NextAuth) เพื่อใช้ session แบบ database
          const naUser = await upsertNextAuthUser({
            user_id: newUser.user_id,
            name: newUser.user_name,
            image: newUser.img,
          });

          // ส่ง user ที่ NextAuth เข้าใจ (ต้องมี id ของตาราง User)
          return {
            id: naUser.id,
            name: naUser.name,
            email: naUser.email,
            image: naUser.image,
            // เพิ่ม props เผื่ออยากใช้งานต่อใน callback
            login_name: newUser.login_name,
            user_id: newUser.user_id,
          };
        }

        // ล็อกอิน
        const existing = await prisma.users.findFirst({ where: { login_name } });
        if (!existing) {
          throw new Error("Username not found");
        }

        const ok = await bcrypt.compare(password, existing.password);
        if (!ok) {
          throw new Error("Invalid password");
        }

        const naUser = await upsertNextAuthUser({
          user_id: existing.user_id,
          name: existing.user_name,
          image: existing.img,
        });

        return {
          id: naUser.id,
          name: naUser.name,
          email: naUser.email,
          image: naUser.image,
          login_name: existing.login_name,
          user_id: existing.user_id,
        };
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  // คุณตั้งไว้เป็น database → เก็บ session ลงตาราง Session ของ NextAuth
  session: { strategy: "database" },

  callbacks: {
    // เพิ่มข้อมูลจากตาราง users ของคุณเข้าไปใน session.user ทุกครั้งที่โหลด session
    async session({ session, user }) {
      // user ที่นี่คือเรคคอร์ดจากตาราง User (ของ NextAuth Adapter)
      if (session?.user && user?.id) {
        // ดึงข้อมูลโปรไฟล์จริงจากตาราง users ของคุณ ด้วย user_id = user.id
        // (เราเก็บให้เท่ากันไว้ด้านบน)
        try {
          const profile = await prisma.users.findUnique({
            where: { user_id: user.id },
            select: { user_id: true, user_name: true, login_name: true, img: true },
          });

          // set id (จากตาราง User ของ NextAuth)
          session.user.id = user.id;

          // ถ้ามีโปรไฟล์ฝั่งคุณ → แนบเพิ่ม
          if (profile) {
            session.user.user_id = profile.user_id;
            session.user.name = profile.user_name ?? session.user.name;
            session.user.login_name = profile.login_name ?? session.user.login_name;
            session.user.image = profile.img ?? session.user.image;
          }
        } catch {
          // fallback อย่างน้อยคง id เดิมไว้
          session.user.id = user.id;
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
