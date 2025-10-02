"use client";
import { useState,useEffect  } from "react";

export default function CreateBlogModal({ children }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [userId, setUserId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) setUserId(id);
  }, []);


  const handleSubmit = async () => {
    await fetch("http://localhost:8000/api/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        blog_title: title,
        message :message,
      }),
    });
    setOpen(false);
    setTitle("");
    setMessage("");
  };

  return (
    <>
      {children ? (
        <div onClick={() => setOpen(true)}>
          {children}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-lime-400 px-6 py-6 rounded-xl font-medium"
        >
          Create Question
        </button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-md w-96">
            <h2 className="text-lg font-bold mb-3">Create Question</h2>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="border w-full p-2 mb-3 rounded"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message"
              className="border w-full p-2 mb-3 rounded"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="bg-lime-400 px-4 py-2 rounded"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}