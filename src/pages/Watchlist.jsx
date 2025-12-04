import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import { TrashIcon } from "@heroicons/react/24/solid";

export default function Watchlist() {
  const [user, setUser] = useState(null);
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        navigate("/signin");
      } else {
        setUser(data.user);
      }
    };
    fetchUser();
  }, [navigate]);

  // Fetch watchlist items
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("watchlist")
        .select("post_id, posts_with_usernames(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching watchlist:", error);
        setLoading(false);
        return;
      }

      const availableItems = data.filter(
        (item) => item.posts_with_usernames?.availability === true
      );
      const unavailableItems = data.filter(
      (item) => item.posts_with_usernames?.availability === false
    );

    if (unavailableItems.length > 0) {
      await supabase
        .from("watchlist")
        .delete()
        .in(
          "post_id",
          unavailableItems.map((i) => i.post_id)
        )
        .eq("user_id", user.id);
      }
      setWatchlistItems(availableItems);
      setLoading(false);
    };
    fetchWatchlist();
  }, [user]);

  // Remove from watchlist
  const handleRemove = async (postId) => {
    if (!user) return;
    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);

    if (!error) {
      setWatchlistItems((prev) => prev.filter((item) => item.post_id !== postId));
    } else {
      console.error("Error removing from watchlist:", error.message);
    }
  };

  return (
    <div className="form min-h-screen bg-black p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-yellow-400 mb-8">My Watchlist</h1>

      {loading ? (
        <p className="text-white">Loading your watchlist...</p>
      ) : watchlistItems.length === 0 ? (
        <p className="text-gray-300">Your watchlist is empty.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {watchlistItems.map(({ posts_with_usernames: post }) => (
            <div
              key={post.id}
              className="relative bg-black-60 backdrop-blur-md rounded-xl shadow-md p-4 flex flex-col gap-2 border border-gray-700 hover:border-yellow-400 transition-all duration-200"
            >
              {/* Trash Icon */}
              <button
                onClick={() => handleRemove(post.id)}
                className="absolute bottom-3 right-3 text-white-400 hover:text-red-500 transition"
              >
                <TrashIcon className="w-7 h-7" />
              </button>

              {/* Image */}
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-48 object-cover rounded-lg cursor-pointer"
                  onClick={() => navigate(`/post/${post.id}`)}
                />
              )}

              {/* Title */}
              <h2
                onClick={() => navigate(`/post/${post.id}`)}
                className="text-3xl font-bold text-white cursor-pointer hover:text-yellow-400"
              >
                {post.title}
              </h2>

              {/* Price & User */}
              <p className=" text-3xl text-white-400">
                <span className="font-semibold"></span> ${post.price?.toFixed(2)}
              </p>
              <p className="text-white-400 text-[18px] mt-2">
                Posted by:{" "}
                <span className="text-yellow-400">{post.username || "Unknown"}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
