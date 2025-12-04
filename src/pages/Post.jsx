import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import PawBlack from "../assets/black.svg";
import PawWhite from "../assets/white.svg";

export default function Post() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const searchQueryURL = params.get("search") || "";

  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([1, 500]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [sortOption, setSortOption] = useState("date-desc");

  const navigate = useNavigate();

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        await supabase.auth.signOut();
        setUser(null);
      }
    };
    checkSession();
  }, []);

  // Categories
  useEffect(() => {
    const allCategories = [
      "All",
      "Beddings",
      "Books",
      "Clothing",
      "Cooking Appliances",
      "Decorations",
      "Electronics",
      "Furniture",
      "Writing Supplies",
      "Other",
    ];
    setCategories(allCategories);
  }, []);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);

      let query = supabase.from("posts_with_usernames").select("*")
        .eq("status", "uploaded")
        .eq("availability", true);

      if (category && category !== "All") {
        const categoryDbMap = {
          "Beddings": "Beddings",
          "Books": "Books",
          "Clothing": "Clothing",
          "Cooking Appliances": "Cooking Appliances",
          "Decorations": "Decorations",
          "Electronics": "Electronics",
          "Furniture": "Furniture",
          "Writing Supplies": "Writing Supplies",
          "Other": "Other",
        };
        query = query.eq("category", categoryDbMap[category]);
      }
      query = query.gte("price", priceRange[0]).lte("price", priceRange[1]);

      switch (sortOption) {
        case "date-asc":
          query = query.order("created_at", { ascending: true });
          break;
        case "date-desc":
          query = query.order("created_at", { ascending: false });
          break;
        case "price-asc":
          query = query.order("price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("price", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (!error) {
        const postsWithStringIds = data.map(post => ({ ...post, id: post.id.toString() }));
        setPosts(postsWithStringIds);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [category, priceRange, sortOption]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("watchlist")
        .select("post_id")
        .eq("user_id", user.id);

      if (data) setWatchlist(data.map(item => item.post_id.toString()));
    };

    fetchWatchlist();
  }, [user]);

  const handleToggleWatchlist = async (postId) => {
    if (!user) {
      navigate("/signin");
      return;
    }

    const idStr = postId.toString();
    const isAdded = watchlist.includes(idStr);

    setWatchlist(prev =>
      isAdded ? prev.filter(id => id !== idStr) : [...prev, idStr]
    );

    if (isAdded) {
      await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);
    } else {
      await supabase
        .from("watchlist")
        .upsert([{ user_id: user.id, post_id: postId }]);
    }
  };

  const filteredPosts = posts.filter((post) =>
    post.title?.toLowerCase().includes(searchQueryURL.toLowerCase())
  );

  return (
    <div className="form min-h-screen bg-black pt-10 flex flex-col items-center">
      <div className="flex w-full max-w-7xl gap-8">
        {/* SIDEBAR */}
        <div className="w-56">
          <div className="sticky top-0 flex flex-col items-center p-4 bg-black h-screen">
            <label className="text-3xl font-bold text-yellow-400 mb-1 pb-2 font-semibold">
              Category
            </label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-black border border-gray-700 rounded-lg p-2 text-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <label className="mb-2 font-semibold text-center">
              <span className="text-3xl font-bold text-yellow-400 block">Price</span>
              <span className="text-2xl text-white font-medium">
                $1 - ${priceRange[1] === 500 ? "500+" : priceRange[1]}
              </span>
            </label>

            <div className="text-[20px] flex items-center gap-3 w-full">
              <span className="text-white w-6 text-right">1</span>
              <input
                type="range"
                min="1"
                max="500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([1, Number(e.target.value)])}
                className="w-full accent-yellow-400"
              />
              <span className="text-white w-10 text-left">500+</span>
            </div>

            <div className="flex flex-col text-white items-center gap-2 mb-4">
              <label className="text-3xl font-bold text-yellow-400 mb-1 pb-2 font-semibold">
                Sort
              </label>

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-black border border-gray-700 rounded-lg p-2 text-white cursor-pointer"
              >
                <option value="">Sorted by</option>
                <option value="date-desc">Date: Newest to Oldest</option>
                <option value="date-asc">Date: Oldest to Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* POSTS */}
        <div className="flex-1">
          {searchQueryURL && (
            <div className="flex justify-start mb-4">
              <button
                onClick={() => navigate("/post")}
                className="py-2 px-4 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition"
              >
                ← Back
              </button>
            </div>
          )}

          {loading ? (
            <p className="text-white text-center">Loading posts...</p>
          ) : filteredPosts.length === 0 ? (
            <p className="text-white text-center">No available posts.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => {
                return (
                  <div
                    key={post.id}
                    className="relative bg-black-60 backdrop-blur-md rounded-xl shadow-md p-4 flex flex-col justify-between h-full border border-gray-700 hover:border-yellow-400 transition-all duration-200"
                  >
                    <div className="flex-1">
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-48 object-cover rounded-lg mb-2"
                        />
                      )}
                      
                      <h2
                        onClick={() => navigate(`/post/${post.id}`)}
                        className="text-3xl font-bold text-white cursor-pointer transition-colors duration-200 mb-2 group"
                      >
                        {searchQueryURL
                          ? post.title
                              .split(new RegExp(`(${searchQueryURL})`, "gi"))
                              .map((piece, i) => {
                                const isMatch =
                                  piece.toLowerCase() === searchQueryURL.toLowerCase();
                                return (
                                  <span
                                    key={i}
                                    className={`transition-colors duration-200 ${
                                      isMatch ? "underline text-yellow-400" : ""
                                    } group-hover:text-yellow-400`}
                                  >
                                    {piece}
                                  </span>
                                );
                              })
                          : <span className="group-hover:text-yellow-400">{post.title}</span>}
                      </h2>

                      <p className="group text-3xl text-white mb-2">
                        ${post.price?.toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleWatchlist(post.id)}
                      className="absolute top-2 right-2 w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center p-1 hover:scale-110 transition-transform z-10"
                    >
                      <img
                        src={watchlist.includes(post.id.toString()) ? PawBlack : PawWhite}
                        alt="paw icon"
                        className="w-6 h-6"
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
