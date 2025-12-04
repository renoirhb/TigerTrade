import { useState } from "react";

export default function Offer({ post, user, buyerUsername, onClose }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const buyerEmail = user?.email;
  const sellerEmail = post?.email;
  const sellerName = post?.seller_name || post?.username || "";

  const handleSubmit = async () => {
    if (!user) {
      alert("Please sign in before making an offer.");
      return;
    }

    if (!post?.title) { alert("Item title is missing"); return; }
    if (!buyerUsername) { alert("Buyer username is missing"); return; }
    if (!sellerEmail) { alert("Seller email is missing"); return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { alert("Invalid offer amount"); return; }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/send-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: post.title,       // actual title
          postId: post.id,
          buyerEmail,
          buyerName: buyerUsername,
          sellerEmail,
          sellerName,                // optional/display only
          amount,
          note,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || "Failed to send offer");
      alert("Your offer has been sent!");
      onClose();
    } catch (err) {
      console.error("Offer error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md text-white">
        <h2 className="text-4xl font-bold mb-4 text-yellow-400">Make an Offer</h2>

        <label className="block mb-2 font-bold">Your Offer ($)</label>
        <input
          type="number"
          className="w-full p-2 rounded bg-gray-800 mb-4"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter your offer"
        />

        <label className="block mb-2">Note:</label>
        <textarea
          className="w-full p-2 rounded bg-gray-800 mb-4"
          rows="4"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-300 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Offer"}
          </button>
        </div>
      </div>
    </div>
  );
}
