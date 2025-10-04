/* import เหมือนเดิม */

export default function Profile() {
  const { data: session, status } = useSession()

  /* เหมือนเดิม */
  return (
    status === 'authenticated' &&
    session.user && (
      <div className="flex h-screen items-center justify-center">
        <div className="bg-white p-6 rounded-md shadow-md">
          {/* ทำการเพิ่มส่วนรูปภาพเข้ามา */}
          <div className="text-center mb-4">
            <img
              src={session.user.image}
              className="rounded-full w-20 h-20 mx-auto"
            />
          </div>
          <p>
            Welcome, <b>{session.user.name}!</b>
          </p>
          <p>Email: {session.user.email}</p>
          <p>Role: {session.user.role}</p>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full bg-blue-500 text-white py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    )
  )
}