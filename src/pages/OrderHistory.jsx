import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData?.user;
      if (!user) {
        navigate("/signin");
        return;
      }

      const { data, error } = await supabase
        .from("order_history")
        .select("*")
        .eq("buyer_email", user.email)
        .order("created_at", { ascending: false });

      if (!error) setOrders(data || []);
      setLoading(false);
    };
    fetchHistory();
  }, []);

  if (loading)
    return <p className="text-white text-center mt-10">Loading...</p>;

  return (
    <div className="form min-h-screen bg-black pt-10 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-yellow-400 mb-6">Order History</h1>

      {orders.length === 0 ? (
        <p className="text-white">No completed orders yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-black-60 backdrop-blur-md rounded-xl shadow-md p-4 border border-gray-700 hover:border-yellow-400 transition-all"
            >
              <img
                src={o.image_url}
                alt={o.title}
                className="w-full h-48 object-cover rounded-lg mb-2"
              />

              <h2
                className="text-3xl font-bold text-white mb-1 cursor-pointer hover:text-yellow-400"
                onClick={() =>
                  navigate("/feedback", { 
                    state: { 
                      title: o.title, 
                      orderId: o.id, 
                      image_url: o.image_url,
                      seller_username: o.seller_username, 
                      purchased_at: o.created_at
                    } 
                  })
                }
              >
                {o.title}
              </h2>
              
              <p className="text-white text-3xl mb-1">${o.price?.toFixed(2)}</p>
              <p className="text-white-400 text-md">Seller: {o.seller_username}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
