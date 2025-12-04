import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import PawBlack from "../assets/black.svg";
import PawWhite from "../assets/white.svg";
import ChatBox from "../components/ChatBox";
import Offer from "../components/Offer";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [buyerUsername, setBuyerUsername] = useState("Buyer");
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistId, setWatchlistId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const [offerOpen, setOfferOpen] = useState(false);
  const [offerLoading, setOfferLoading] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!document.getElementById("more-options-box")?.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchBuyerUsername = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.username) setBuyerUsername(data.username);
    };
    fetchBuyerUsername();
  }, [user]);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts_with_usernames")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) console.error(error.message);
      else setPost(data);
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  useEffect(() => {
    const checkWatchlist = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", user.id)
        .eq("post_id", id)
        .maybeSingle();

      if (data) {
        setIsInWatchlist(true);
        setWatchlistId(data.id);
      }
    };
    checkWatchlist();
  }, [user, id]);

  const handleToggleWatchlist = async () => {
    if (!user) {
      navigate("/signin");
      return;
    }

    if (isInWatchlist && watchlistId) {
      await supabase.from("watchlist").delete().eq("id", watchlistId);
      setIsInWatchlist(false);
      setWatchlistId(null);
    } else {
      const { data } = await supabase
        .from("watchlist")
        .insert([{ user_id: user.id, post_id: id }])
        .select()
        .single();

      setIsInWatchlist(true);
      setWatchlistId(data.id);
    }
  };
  if (loading) return <p className="text-white p-6">Loading post...</p>;
  if (!post) return <p className="text-white p-6">Post not found.</p>;

  return (
    <div className="min-h-screen bg-black p-6 flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="form px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-300 w-max"
      >
        Back
      </button>

      <div className="flex flex-col lg:flex-row gap-6 items-start relative">
        {/* Image */}
        {post.image_url && (
          <div className="relative w-full lg:w-1/2">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-auto object-cover rounded-xl"
            />

            {/* Paw icon */}
            <button
              onClick={() => handleToggleWatchlist(post.id)}
              className="absolute top-2 right-2 w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center p-1 hover:scale-110 transition-transform"
            >
              <img
                src={isInWatchlist ? PawBlack : PawWhite}
                alt="paw icon"
                className="w-6 h-6"
              />
            </button>
          </div>
        )}
        {/* Post Info */}
        <div className="form flex-1 flex flex-col gap-4 text-white rounded-xl p-4">
          <div className="form-title">
            <h1 className="font-bold text-yellow-400 text-4xl">{post.title}</h1>
            <p>${post.price?.toFixed(2)}</p>
          </div>

          <p className="form-footer text-md">
            <span className="font-semibold">Description: </span>
            {post.description}
          </p>

          <p className="form-footer text-md">
            Posted by:{" "}
            <span 
              className="text-yellow-400 cursor-pointer hover:underline"
              onClick={() => navigate(`/seller/${post.user_id}`)}
            >
              {post.username || "Unknown"}
            </span>
          </p>

          <div className="flex flex-col items-center gap-4 w-full">
            {/* Order Confirmation */}
            <button
              onClick={() => {
                if (!user) {
                  navigate("/signin"); 
                  return;
                }
                navigate(`/buy?id=${post.id}`);
              }}
              className="py-2 px-6 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 w-40"
            >
              Buy Now
            </button>

            {/* Offer making */}
            <button
              onClick={() => {
                if (!user) {
                  navigate("/signin");
                  return;
                }
                setOfferOpen(true);
              }}
              className="py-2 px-6 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 w-40"
            >
              Make an Offer
            </button>

            {/* Watchlist adding */}
            <button
              onClick={() => handleToggleWatchlist(post.id)}
              className={`py-2 px-4 rounded-lg font-semibold transition-all duration-200 w-40 ${
                isInWatchlist
                  ? "bg-gray-500 text-white hover:bg-gray-400"
                  : "bg-yellow-400 text-black hover:bg-yellow-300"
              }`}
            >
              {isInWatchlist ? "Remove" : "Add to Watchlist"}
            </button>

            {/* More options */}
            <div id="more-options-box" className="relative w-40">
              <button
                onClick={(e) => {
                  e.stopPropagation(); 
                  setMoreOpen(!moreOpen);
                }}
                className="py-2 px-4 bg-white text-black rounded-lg hover:bg-gray-200 w-full flex justify-between items-center"
              >
                More Options
                <span className="text-lg transition-transform duration-200">
                  {moreOpen ? "▲" : "▼"}
                </span>
              </button>

              {moreOpen && (
                <div className="absolute left-0 mt-2 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                  {/* Chat with seller */}
                  <button
                    onClick={() => {
                      if (!user) {
                        navigate("/signin");
                        return;
                      }
                      setMoreOpen(false);
                      setChatOpen(true);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-700"
                  >
                    Contact Seller
                  </button>
                  {/* View Seller's Profile */}
                  <button 
                    onClick={() => navigate(`/seller/${post.user_id}`)}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-700"
                  >
                      View Seller’s Profile
                  </button>
                </div>
              )}
            </div>
            {chatOpen && (
                    <ChatBox
                      currentUser={user.email || user.id}
                      recipient={post.username} // seller's username
                      onClose={() => setChatOpen(false)}
                    />
                  )}
          </div>
        </div>
      {/* Popup for Offer Making */}
      </div>
      {offerOpen && (
        <Offer
          post={post}
          user={user}
          buyerUsername={buyerUsername}
          loading={offerLoading}
          setLoading={setOfferLoading} 
          onClose={() => setOfferOpen(false)}
        />
      )}
    </div>
  );
}
