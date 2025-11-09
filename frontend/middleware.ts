// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log(token)
  const toLogin = () => {
    const loginUrl = new URL("/login", url);
    loginUrl.searchParams.set("callbackUrl", path + (url.search || ""));
    return NextResponse.redirect(loginUrl);
  };

  if (path.startsWith("/blog") || path.startsWith("/party")) {
    if (!token || (token.role !== "member" && token.role !== "admin")) {
      return toLogin();
    }
  }

  if (path.startsWith("/admin")) {
    if (!token || token.role !== "admin") {
      return NextResponse.redirect(new URL("/", url));
    }
  }

  if (req.nextUrl.pathname.startsWith('/settings')) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('callbackUrl', req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/blog/:path*", "/party/:path*", "/admin/:path*",'/settings/:path*'],
};
