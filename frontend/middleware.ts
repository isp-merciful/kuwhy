// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // แนะนำ: ไม่ console.log ในโปรดักชัน
  if (process.env.NODE_ENV !== "production") {
    // console.log("[mw] token", token);
  }

  const toLogin = () => {
    const loginUrl = new URL("/login", url);
    // เก็บเส้นทางเดิมไว้ (รวม query)
    loginUrl.searchParams.set("callbackUrl", path + (url.search || ""));
    return NextResponse.redirect(loginUrl);
  };

  const isMember = token && (token.role === "member" || token.role === "admin");
  const isAdmin = token && token.role === "admin";

  // ต้องล็อกอิน (role ใดก็ได้) สำหรับ settings
  if (path.startsWith("/settings")) {
    if (!token) return toLogin();
  }

  // ต้องเป็นสมาชิกอย่างน้อย (member/admin) สำหรับ blog/party
  if (path.startsWith("/blog") || path.startsWith("/party")) {
    if (!isMember) return toLogin();
  }

  // ต้องเป็น admin สำหรับ /admin/*
  if (path.startsWith("/admin")) {
    if (!isAdmin) return NextResponse.redirect(new URL("/", url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/blog/:path*", "/party/:path*", "/admin/:path*", "/settings"],
};
