import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import PostUploaded from "../components/PostUploaded";
import PostDraft from "../components/PostDraft";

export default function MyPost() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("uploaded");
  const [refreshKey, setRefreshKey] = useState(0); 

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    };
    fetchUser();
  }, []);

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);
  if (!user) return <p className="text-white">Please sign in to view your posts.</p>;

  return (
    <div className="form flex flex-col items-center p-6 text-white min-h-screen">
      <h2 className="form-intro text-4xl font-bold text-yellow-400 mb-6">My Posts</h2>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setView("uploaded")}
          className={`px-4 py-2 font-semibold rounded transition ${
            view === "uploaded" ? "bg-yellow-400 text-black" : "bg-white text-black"
          }`}
        >
          Uploaded
        </button>

        <button
          onClick={() => setView("draft")}
          className={`px-4 py-2 font-semibold rounded transition ${
            view === "draft" ? "bg-yellow-400 text-black" : "bg-white text-black"
          }`}
        >
          Drafts
        </button>
      </div>

      {/* Post Views */}
      {view === "uploaded" ? (
        <PostUploaded key={refreshKey} userId={user.id} onChange={handleRefresh} />
      ) : (
        <PostDraft key={refreshKey} userId={user.id} onChange={handleRefresh} />
      )}
    </div>
  );
}
