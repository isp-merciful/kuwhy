import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const API_BASE = "http://localhost:8000/api";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        userId: { label: "User ID", type: "text" },
        userName: { label: "Display Name", type: "text" }
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API_BASE}/user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: credentials?.userId,
              user_name: credentials?.userName
            })
          });

          if (!res.ok) return null;
          const data = await res.json();
          const user = data.user || {
            user_id: data.user_id || credentials?.userId,
            user_name: data.user_name || credentials?.userName || "anonymous",
            img: data.img || "/images/pfp.png"
          };

          return {
            id: String(user.user_id),
            name: user.user_name,
            image: user.img
          };
        } catch (_err) {
          return null;
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.picture = user.image;
      }
      if (account) {
        token.provider = account.provider;
        token.access_token = account.access_token || account.accessToken;
        token.id_token = account.id_token;
        token.expires_at = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.image = token.picture;
      }
      session.provider = token.provider;
      session.access_token = token.access_token;
      session.id_token = token.id_token;
      session.expires_at = token.expires_at;
      return session;
    }
  }
});

export { handler as GET, handler as POST };


