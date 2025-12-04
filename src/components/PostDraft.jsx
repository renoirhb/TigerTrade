import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function PostDraft({ userId }) {
  const [drafts, setDrafts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDrafts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "draft")
        .order("created_at", { ascending: false });

      if (!error) setDrafts(data);
    };
    fetchDrafts();
  }, [userId]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;

    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      alert("Delete failed: " + error.message);
      return;
    }
    setDrafts(drafts.filter((d) => d.id !== id));
  };

  return (
    <div className="min-h-screen p-6 flex flex-col items-center gap-6 text-white">
      {drafts.length === 0 ? (
        <p>No drafts yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {drafts.map((post) => (
            <div
              key={post.id}
              className="bg-black/60 text-3xl backdrop-blur-md rounded-xl shadow-md p-4 flex flex-col gap-2 border border-gray-700 hover:border-yellow-400 transition-all duration-200"
            >
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <h4 className="text-3xl font-bold text-yellow-400 cursor-pointer hover:underline">{post.title}</h4>
              <p>${post.price}</p>
              
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() =>
                    navigate("/editpost", { state: { postToEdit: post } })
                  }
                  className="flex-1 bg-blue-500 text-white py-1 px-4 text-2xl rounded hover:bg-blue-400 transition"
                >
                  Edit
                </button>
                
                <button
                  onClick={() => handleDelete(post.id)}
                  className="flex-1 bg-red-500 text-white py-1 px-4 text-2xl rounded hover:bg-red-400 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
