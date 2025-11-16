"use client";
import { useEffect, useState } from "react";

// Helper: flatten tree of comments
const flattenComments = (comments, level = 0) => {
  let arr = [];
  comments.forEach((c) => {
    arr.push({ ...c, level });
    if (Array.isArray(c.children) && c.children.length > 0) {
      arr = arr.concat(flattenComments(c.children, level + 1));
    }
  });
  return arr;
};

export default function AdminPage() {
  const categories = ["user", "note", "blog", "comment"];
  const [category, setCategory] = useState("note");
  const [sort, setSort] = useState("DESC");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = `http://localhost:8000/api/${category}`;
      const res = await fetch(apiUrl);
      const json = await res.json();

      let items = [];
      if (category === "comment" && json.comment) {
        items = flattenComments(json.comment);
      } else {
        items = Array.isArray(json) ? json : [];
      }

      // Sort by created_at if exists, else by id/uuid
      items.sort((a, b) => {
        let keyA = a.created_at ?? a.id ?? a.user_id ?? a.note_id ?? a.blog_id;
        let keyB = b.created_at ?? b.id ?? b.user_id ?? b.note_id ?? b.blog_id;
        let valA = a.created_at ? new Date(keyA) : keyA;
        let valB = b.created_at ? new Date(keyB) : keyB;
        return sort === "ASC" ? valA - valB : valB - valA;
      });

      setData(items);
    } catch (err) {
      console.error(err);
      setData([]);
    }
    setLoading(false);
  };

  // Delete item by proper id depending on category
  const handleDelete = async (item) => {
    let idToDelete;
    switch (category) {
      case "comment":
        idToDelete = item.comment_id;
        break;
      case "note":
        idToDelete = item.note_id;
        break;
      case "blog":
        idToDelete = item.blog_id;
        break;
      case "user":
        idToDelete = item.user_id;
        break;
      default:
        console.error("Unknown category");
        return;
    }

    if (!idToDelete) return;

    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await fetch(`http://localhost:8000/api/${category}/${idToDelete}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Check if value is image URL
  const isImageUrl = (val) => {
    if (typeof val !== "string") return false;
    return val.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  };

  // Scroll to a comment by ID
  const scrollToComment = (id) => {
    const el = document.getElementById(`comment-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    fetchData();
  }, [category, sort]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Admin Panel</h1>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <div>
          <label className="mr-2 font-semibold">Category:</label>
          <select
            className="border rounded px-2 py-1"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mr-2 font-semibold">Sort:</label>
          <select
            className="border rounded px-2 py-1"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="DESC">Newest First</option>
            <option value="ASC">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-gray-500">Loading</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-800 text-white">
              <tr>
                {data[0] &&
                  Object.keys(data[0])
                    .filter((k) => k !== "children")
                    .map((key) => (
                      <th
                        key={key}
                        className="text-center px-4 py-2 border-b border-gray-300"
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </th>
                    ))}
                {category === "comment" && (
                  <th className="px-4 py-2 border-b border-gray-300 text-center">
                    Children
                  </th>
                )}
                <th className="px-4 py-2 border-b border-gray-300 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {data.length > 0 ? (
                data.map((item, rowIndex) => {
                  const uniqueKey =
                    (item.comment_id ||
                      item.id ||
                      item.user_id ||
                      item.note_id ||
                      item.blog_id ||
                      "row") + "-" + rowIndex;

                  return (
                    <tr
                      key={uniqueKey}
                      id={category === "comment" ? `comment-${item.comment_id}` : undefined}
                      className="hover:bg-gray-100"
                    >
                      {Object.entries(item)
                        .filter(([k]) => k !== "children")
                        .map(([key, val], colIndex) => (
                          <td
                            key={colIndex}
                            className="px-4 py-2 border-b border-gray-200 text-center"
                          >
                            {val === null || val === undefined
                              ? "null"
                              : isImageUrl(val)
                              ? (
                                <img
                                  src={val}
                                  alt={key}
                                  className="w-12 h-12 object-cover rounded-full mx-auto"
                                />
                              )
                              : val.toString()}
                          </td>
                        ))}

                      {/* Children column for comments */}
                      {category === "comment" && (
                        <td className="px-4 py-2 border-b border-gray-200 text-center">
                          {Array.isArray(item.children) && item.children.length > 0 ? (
                            <button
                              className="text-blue-500 underline hover:text-blue-700"
                              onClick={() => scrollToComment(item.children[0].comment_id)}
                            >
                              {item.children.length}
                            </button>
                          ) : (
                            "0"
                          )}
                        </td>
                      )}

                      {/* Delete column */}
                      <td className="px-4 py-2 border-b border-gray-200 text-center">
                        <button
                          onClick={() => handleDelete(item)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={(data[0] ? Object.keys(data[0]).length : 0) + 2}
                    className="text-center px-4 py-4 text-gray-500"
                  >
                    No data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
