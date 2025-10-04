'use client';

import { useSession, signIn, signOut } from "next-auth/react";

export default function LoginPage() {
  const { data: session } = useSession();

  if (!session) {
    return <button onClick={() => signIn("google")}>Sign in with Google</button>;
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
