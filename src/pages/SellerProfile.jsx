import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import PostCard from "../components/PostCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as solidStar, faStarHalfAlt } from "@fortawesome/free-solid-svg-icons";
import { faStar as regularStar } from "@fortawesome/free-regular-svg-icons";
import { FaStar } from "react-icons/fa";

export default function SellerProfile() {
  const { sellerId } = useParams();
  const navigate = useNavigate();

  const [seller, setSeller] = useState(null);
  const [posts, setPosts] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [sortOption, setSortOption] = useState("date-desc");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("uploaded");
  const [loading, setLoading] = useState(true);

  const [avgRating, setAvgRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState({ 5:0, 4:0, 3:0, 2:0, 1:0 });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch seller info
  useEffect(() => {
    const fetchSeller = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sellerId)
        .single();
      setSeller(data || null);
    };
    fetchSeller();
  }, [sellerId]);

  // Fetch average ratings
  useEffect(() => {
    const fetchRatings = async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("user_rating")
        .eq("seller_id", sellerId);

      if (!error && data) {
        if (data.length === 0) {
          setAvgRating(0);
          setRatingsCount({5:0,4:0,3:0,2:0,1:0});
          return;
        }
        const sum = data.reduce((acc, f) => acc + (f.user_rating || 0), 0);
        setAvgRating(sum / data.length);

        const counts = {5:0,4:0,3:0,2:0,1:0};
        data.forEach(f => { if(f.user_rating) counts[f.user_rating]++; });
        setRatingsCount(counts);
      } else {
        setAvgRating(0);
        setRatingsCount({5:0,4:0,3:0,2:0,1:0});
      }
    };
    fetchRatings();
  }, [sellerId]);

  // Fetch selling or sold items
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      if (statusFilter === "uploaded") {
        let query = supabase
          .from("posts")
          .select("*")
          .eq("user_id", sellerId)
          .eq("availability", true);

        if (category !== "All") query = query.eq("category", category);

        switch (sortOption) {
          case "date-asc": query = query.order("created_at", { ascending: true }); break;
          case "date-desc": query = query.order("created_at", { ascending: false }); break;
          case "price-asc": query = query.order("price", { ascending: true }); break;
          case "price-desc": query = query.order("price", { ascending: false }); break;
          default: query = query.order("created_at", { ascending: false });
        }

        const { data, error } = await query;
        if (!error) setPosts(data || []);
      } else if (statusFilter === "sold") {
        // Fetch sold posts with feedback
        let { data, error } = await supabase
          .from("order_history")
          .select("*, feedback(*)")
          .eq("seller_id", sellerId)
          .order("created_at", { ascending: false });

        if (!error) setPosts(data || []);
        else console.error(error);
      }
      setLoading(false);
    };
    fetchPosts();
  }, [sellerId, sortOption, category, statusFilter]);

  // Fetch watchlist
  useEffect(() => {
    const fetchWatchlist = async () => {
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData?.user;
      if (!user) return;

      const { data } = await supabase
        .from("watchlist")
        .select("post_id")
        .eq("user_id", user.id);

      if (data) setWatchlist(data.map(i => i.post_id));
    };
    fetchWatchlist();
  }, []);

  const handleToggleWatchlist = async (postId) => {
    const { data: session } = await supabase.auth.getUser();
    const user = session?.user;
    if (!user) {
      navigate("/signin");
      return;
    }

    const isAdded = watchlist.includes(postId);
    if (isAdded) {
      await supabase.from("watchlist").delete().eq("user_id", user.id).eq("post_id", postId);
      setWatchlist(prev => prev.filter(id => id !== postId));
    } else {
      await supabase.from("watchlist").upsert([{ user_id: user.id, post_id: postId }]);
      setWatchlist(prev => [...prev, postId]);
    }
  };

  return (
    <div className="form min-h-screen bg-black p-6 flex flex-col gap-6 pt-12">
      <div className="max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-4 gap-6 item-start">
          {/* Seller info */}
          <div className="flex flex-col gap-4 sticky top-20 h-fit self-start">
            {seller && (
              <>
                <h1 className="text-6xl font-bold text-yellow-400">{seller.username}</h1>
                <p className="text-white text-2xl">{seller.email}</p>

                <div className="relative flex items-center gap-2 justify-center">
                  <span className="text-white text-2xl">{avgRating.toFixed(1)}</span>
                  {(() => {
                    const filled = Math.floor(avgRating);
                    const decimal = avgRating - filled;
                    const hasHalf = decimal >= 0.25 && decimal < 0.75;
                    const empty = 5 - filled - (hasHalf ? 1 : 0);

                    return (
                      <>
                        {[...Array(filled)].map((_, i) => (
                          <FontAwesomeIcon key={`full-${i}`} icon={solidStar} className="text-yellow-400" />
                        ))}
                        {hasHalf && <FontAwesomeIcon key="half" icon={faStarHalfAlt} className="text-yellow-400" />}
                        {[...Array(empty)].map((_, i) => (
                          <FontAwesomeIcon key={`empty-${i}`} icon={regularStar} className="text-yellow-400" />
                        ))}
                      </>
                    );
                  })()}

                  <button className="text-white ml-2" onClick={() => setDropdownOpen(prev => !prev)}>
                    {dropdownOpen ? "▲" : "▼"}
                  </button>

                  {dropdownOpen && (
                    <div className="absolute top-10 left-0 bg-black border border-gray-700 p-4 rounded shadow-lg w-64 z-50">
                      {[5,4,3,2,1].map(star => {
                        const count = ratingsCount[star] || 0;
                        const total = Object.values(ratingsCount).reduce((a,b)=>a+b,0) || 1;
                        const width = Math.round((count / total) * 100);
                        return (
                          <div key={star} className="flex items-center gap-2 mb-1">
                            <span className="text-white w-4">{star}</span>
                            <div className="flex-1 h-4 bg-gray-700 rounded overflow-hidden">
                              <div className="h-full bg-yellow-400" style={{width: `${width}%`}} />
                            </div>
                            <span className="text-white w-6 text-right">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
            {/* Sort and Category filters */}
            <div>
              <label className="text-2xl font-semibold mr-2">Sort:</label>
              <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="bg-black border border-gray-700 rounded-lg p-2 text-white cursor-pointer">
                <option value="date-desc">Newest</option>
                <option value="date-asc">Oldest</option>
                <option value="price-asc">Price Low → High</option>
                <option value="price-desc">Price High → Low</option>
              </select>
            </div>

            <div>
              <label className="text-2xl font-semibold mr-2">Category:</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="bg-black border border-gray-700 rounded-lg p-2 text-white cursor-pointer">
                <option value="All">All</option>
                <option value="Beddings">Beddings</option>
                <option value="Books">Books</option>
                <option value="Clothing">Clothing</option>
                <option value="Cooking appliance">Cooking Appliances</option>
                <option value="Decorations">Decorations</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Writing supplies">Writing Supplies</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="col-span-3 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 justify-center">
              <div className="flex gap-2">
                <button onClick={() => setStatusFilter("uploaded")} className={`px-4 py-2 rounded ${statusFilter==="uploaded" ? "bg-yellow-400 text-black":"bg-gray-700 text-white"}`}>Selling</button>
                <button onClick={() => setStatusFilter("sold")} className={`px-4 py-2 rounded ${statusFilter==="sold" ? "bg-yellow-400 text-black":"bg-gray-700 text-white"}`}>Sold Out</button>
              </div>
            </div>

            {loading ? (
              <p className="text-center text-white">Loading...</p>
            ) : posts.length === 0 ? (
              <p className="text-center text-white">No posts found.</p>
            ) : statusFilter === "uploaded" ? (

              <div className="grid grid-cols-3 gap-4">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isAdded={watchlist.includes(post.id)}
                    onToggle={() => handleToggleWatchlist(post.id)}
                    onOpen={() => navigate(`/post/${post.id}`)}
                  />
                ))}
              </div>

            ) : (
              <div className="flex flex-col gap-4">
                {posts.map(order => (
                  <div key={order.id} className="w-[900px] flex bg-gray-900 rounded-xl p-6 gap-6 mx-auto">
                    {/* Image */}
                    <div className="flex flex-col gap-4 w-1/3">
                      {order.image_url ? (
                        <img src={order.image_url} alt={order.title} className="w-full h-64 object-cover rounded-lg" />
                      ) : (
                        <div className="w-full h-64 bg-gray-700 flex items-center justify-center rounded-lg">No Image</div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="flex flex-col gap-2 w-1/3 justify-center text-left">
                      <h1 className="text-4xl font-bold text-yellow-400">{order.title}</h1>
                      <p className="text-white text-3xl mt-2">Price: ${order.price?.toFixed(2) || "-"}</p>
                      <p className="text-white text-xl mt-1">Purchased at: {order.created_at ? new Date(order.created_at).toLocaleString() : "-"}</p>
                    </div>

                    {/* Rating & feedback */}
                    <div className="flex flex-col gap-4 w-1/3 justify-center ml-auto">
                      {order.feedback && order.feedback.length > 0 ? (
                        <>
                          <div>
                            <span className="font-semibold text-white text-2xl">Item Rating:</span>
                            <StarDisplay 
                              rating={order.feedback[0].item_rating || 0}
                            />
                          </div>
                          
                          <div className="flex flex-col gap-1 mt-2">
                            <span className="font-semibold text-white text-2xl">Feedback:</span>
                            <p className="text-white">{order.feedback[0].feedback_text || "-"}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-white text-xl">No feedback yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// StarDisplay component
function StarDisplay({ rating }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <FaStar 
        key={i} 
        className={i <= rating ? "fill-current text-yellow-400" : "text-gray-500"} 
      />
    );
  }
  return <div className="flex gap-1 justify-center mt-3">{stars}</div>;
}