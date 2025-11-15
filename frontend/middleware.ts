// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const toLogin = () => {
    const loginUrl = new URL("/login", url);
    loginUrl.searchParams.set("callbackUrl", path + (url.search || ""));
    return NextResponse.redirect(loginUrl);
  };

  const isMember = token && (token.role === "member" || token.role === "admin");
  const isAdmin = token && token.role === "admin";

 
  if (path.startsWith("/settings")) {
    if (!token) return toLogin();
  }


  if (path.startsWith("/party")) {
    if (!isMember) return toLogin();
  }

  
  if (path.startsWith("/admin")) {
    if (!isAdmin) return NextResponse.redirect(new URL("/", url));
  }

  return NextResponse.next();
}

export const config = {
 
  matcher: ["/party/:path*", "/admin/:path*", "/settings"],
};