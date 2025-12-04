import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import { FaStar } from "react-icons/fa";

export default function Feedback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = location.state || {};

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [activePopup, setActivePopup] = useState(null); // 'item', 'user', 'feedback'
  const [itemRating, setItemRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  const [submittedFeedback, setSubmittedFeedback] = useState({
    itemRating: null,
    userRating: null,
    feedbackText: ""
  });

  // Fetch current user, order, and existing feedback
  useEffect(() => {
    const fetchData = async () => {
      // Get current user
      const { data: sessionData } = await supabase.auth.getUser();
      const currentUser = sessionData?.user;
      if (!currentUser) {
        navigate("/signin");
        return;
      }
      setUser(currentUser);

      // Get order info
      if (!orderId) return;
      const { data: orderData, error: orderError } = await supabase
        .from("order_history")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) {
        console.error(orderError);
        setLoading(false);
        return;
      }
      setOrder(orderData);

      // Fetch existing feedback for this order
      const { data: existingFeedback } = await supabase
        .from("feedback")
        .select("*")
        .eq("order_id", orderData.id)
        .eq("buyer_id", currentUser.id)
        .maybeSingle();

      if (existingFeedback) {
        setSubmittedFeedback({
          itemRating: existingFeedback.item_rating,
          userRating: existingFeedback.user_rating,
          feedbackText: existingFeedback.feedback_text,
        });
        setItemRating(existingFeedback.item_rating || 0);
        setUserRating(existingFeedback.user_rating || 0);
        setFeedbackText(existingFeedback.feedback_text || "");
      }

      setLoading(false);
    };

    fetchData();
  }, [orderId, navigate]);

  if (loading) return <p className="text-white text-center mt-10">Loading...</p>;
  if (!order) return <p className="text-white text-center mt-10">Order not found.</p>;

  const submitRating = async (type) => {
    if (!user) return alert("Please sign in first.");

    const feedbackRecord = {
      order_id: order.id,
      item_id: order.post_id,
      buyer_id: user.id,
      seller_id: order.seller_id,
      item_rating: type === "item" ? itemRating : submittedFeedback.itemRating,
      user_rating: type === "user" ? userRating : submittedFeedback.userRating,
      feedback_text: type === "feedback" ? feedbackText : submittedFeedback.feedbackText,
    };

    try {
      const { data: existing } = await supabase
        .from("feedback")
        .select("id")
        .eq("order_id", order.id)
        .eq("buyer_id", user.id)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("feedback")
          .update(feedbackRecord)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("feedback")
          .insert(feedbackRecord);
        if (error) throw error;
      }

      if (type === "item") setSubmittedFeedback((prev) => ({ ...prev, itemRating }));
      if (type === "user") setSubmittedFeedback((prev) => ({ ...prev, userRating }));
      if (type === "feedback") setSubmittedFeedback((prev) => ({ ...prev, feedbackText }));

      setActivePopup(null);
    } catch (err) {
      console.error(err);
      alert("Failed to submit feedback");
    }
  };

  return (
    <div className="form min-h-screen bg-black p-6 flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="form px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-300 w-max"
      >
        Back
      </button>

      <div className="w-[900px] flex bg-gray-900 rounded-xl p-6 gap-6 mx-auto">
        {/* Image */}
        <div className="flex flex-col gap-4 w-1/3">
          {order.image_url ? (
            <img
              src={order.image_url}
              alt={order.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-64 bg-gray-700 flex items-center justify-center rounded-lg">
              No Image
            </div>
          )}
        </div>

        {/* Item Info */}
        <div className="flex flex-col gap-2 w-1/3 justify-center text-left">
          <h1 className="text-4xl font-bold text-yellow-400">{order.title}</h1>
          <p className="text-white text-3xl mt-2">Price: ${order.price?.toFixed(2) || "-"}</p>
          <p className="text-white text-2xl mt-1">
            Seller:{" "}
            <span 
              className="text-yellow-400 cursor-pointer hover:underline"
              onClick={() => navigate(`/seller/${order.seller_id}`)} 
            >
              {order.seller_username}
            </span>
          </p>
          <p className="text-white text-xl">
            Purchased at: {order.created_at ? new Date(order.created_at).toLocaleString() : "-"}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4 w-1/5 justify-center ml-auto">
          <button
            onClick={() => setActivePopup("item")}
            className="py-2 px-3 text-black bg-yellow-400 hover:bg-yellow-300 rounded-lg text-2xl"
          >
            Rate Item
          </button>
          <button
            onClick={() => setActivePopup("user")}
            className="py-2 px-4 text-black bg-yellow-400 hover:bg-yellow-300 rounded-lg text-2xl"
          >
            Rate Seller
          </button>
          <button
            onClick={() => setActivePopup("feedback")}
            className="py-2 px-4 text-black bg-yellow-400 hover:bg-yellow-300 rounded-lg text-2xl"
          >
            Feedback
          </button>
        </div>
      </div>

      {/* Display feedback */}
      <div className="w-[800px] mx-auto mt-6 p-6 bg-gray-900 rounded-xl">
        <h2 className="text-4xl font-bold text-yellow-400 mb-4">My Feedback</h2>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Item Rating:</span>
            <StarDisplay rating={submittedFeedback.itemRating} />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">User Rating:</span>
            <StarDisplay rating={submittedFeedback.userRating} />
        </div>

        <div className="flex flex-col gap-1 mt-2 text-left">
          <span className="font-semibold text-white">Feedback:</span>
          <p className="text-white">{submittedFeedback.feedbackText || "-"}</p>
        </div>
      </div>

      {/* Popups */}
      {activePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-96 max-w-full relative flex flex-col gap-4">
            <button
              onClick={() => setActivePopup(null)}
              className="absolute top-2 right-2 text-white text-xl font-bold"
            >
              ✕
            </button>

            {activePopup === "item" && (
              <>
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">Rate Item</h2>
                <StarRating rating={itemRating} setRating={setItemRating} />
                <button
                  onClick={() => submitRating("item")}
                  className="mt-4 py-2 px-4 bg-yellow-400 text-black rounded hover:bg-yellow-300"
                >
                  Submit
                </button>
              </>
            )}

            {activePopup === "user" && (
              <>
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">Rate User</h2>
                <StarRating rating={userRating} setRating={setUserRating} />
                <button
                  onClick={() => submitRating("user")}
                  className="mt-4 py-2 px-4 bg-yellow-400 text-black rounded hover:bg-yellow-300"
                >
                  Submit
                </button>
              </>
            )}

            {activePopup === "feedback" && (
              <>
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">Feedback</h2>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Write your feedback here..."
                  className="w-full p-2 rounded text-white"
                  rows={5}
                />
                <button
                  onClick={() => submitRating("feedback")}
                  className="mt-4 py-2 px-4 bg-yellow-400 text-black rounded hover:bg-yellow-300"
                >
                  Submit
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// StarRating component
function StarRating({ rating, setRating }) {
  return (
    <div className="flex gap-2 text-yellow-400 text-3xl cursor-pointer">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          className={star <= rating ? "fill-current" : "text-gray-500"}
          onClick={() => setRating(star)}
        />
      ))}
    </div>
  );
}

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
  return <div className="flex gap-1">{stars}</div>;
}

