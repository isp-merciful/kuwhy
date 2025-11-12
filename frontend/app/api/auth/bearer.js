// app/api/auth/bearer/route.js (Next.js App Router)
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { NextResponse } from "next/server";
import { EncryptJWT } from "jose";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

  const payload = {
    id: session.user.id,
    role: session.user.role || "member",
    name: session.user.name,
    picture: session.user.image,
  };

  const token = await new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .encrypt(secret);

  return NextResponse.json({ token });
}
