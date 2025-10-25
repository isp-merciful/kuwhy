import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

// สร้าง PrismaClient ตรงนี้
const prisma = new PrismaClient();

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        password: { label: "Password", type: "password" },
        email: { label: "Email", type: "email" },
        user_name: { label: "Username", type: "text" },
        isRegister: { label: "Is Register", type: "text" }
      },
      async authorize(credentials) {
        try {
          if (credentials.isRegister === "true") {
            // Registration logic
            const { user_name, email, password } = credentials;
            
            if (!email || !password) {
              throw new Error("Missing email or password");
            }

            // Check if email already exists
            const existingEmail = await prisma.users.findUnique({ 
              where: { email } 
            });
            if (existingEmail) {
              throw new Error("Email already exists");
            }

            // Generate a unique user_id based on email
            const user_id = email.split('@')[0] + '_' + Date.now();

            // Hash password and create user
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await prisma.users.create({
              data: {
                user_id,
                email,
                user_name: user_name || "anonymous",
                password: hashedPassword,
                gender: "Not_Specified",
                img: "/images/pfp.png"
              }
            });

            return {
              id: newUser.user_id,
              name: newUser.user_name,
              email: newUser.email,
              image: newUser.img,
            };
          } else {
            // Login logic
            const { email, password } = credentials;
            
            if (!email || !password) {
              throw new Error("Missing credentials");
            }

            // Find user by email
            const user = await prisma.users.findUnique({ 
              where: { email } 
            });
            
            if (!user) {
              throw new Error("User not found");
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
              throw new Error("Invalid password");
            }

            return {
              id: user.user_id,
              name: user.user_name,
              email: user.email,
              image: user.img,
            };
          }
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt", // Changed to JWT for credentials provider
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.user_id = token.user_id;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.user_id = user.id;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

// ต้อง export GET/POST สำหรับ App Router
export { handler as GET, handler as POST };
