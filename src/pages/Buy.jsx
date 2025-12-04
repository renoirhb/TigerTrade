import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const defaultIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function Buy() {
  const navigate = useNavigate();
  const location = useLocation();
  const postId = new URLSearchParams(location.search).get("id");

  const [post, setPost] = useState(null);
  const [sellerEmail, setSellerEmail] = useState(null);
  const [sellerUsername, setSellerUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [pickupLocation, setPickupLocation] = useState(null);
  const [pickupDate, setPickupDate] = useState(null);

  const locations = [
    { name: "Harrison Hall", lat: 39.6405, lng: -86.8631 },
    { name: "Roy O. West Library", lat: 39.6408, lng: -86.8639 },
    { name: "Asbury Hall", lat: 39.6412, lng: -86.8631 },
    { name: "Lilly Center", lat: 39.6377, lng: -86.8635 },
    { name: "Julian Science and Mathematics Center", lat: 39.6385, lng: -86.8633 },
    { name: "GCPA", lat: 39.6377, lng: -86.8618 },
    { name: "East College", lat: 39.6403, lng: -86.8616 },
    { name: "Union Building", lat: 39.6394, lng: -86.8612 },
    { name: "CDI", lat: 39.6393, lng: -86.8650 },
    { name: "Olin Biological Sciences Building", lat: 39.6393, lng: -86.8636 },
    { name: "Pulliam Center", lat: 39.6375, lng: -86.8602 },
    { name: "Peeler Art Center", lat: 39.6388, lng: -86.8649 },
  ];

  // Auto-fill buyer email
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) setBuyerEmail(data.user.email);
    };
    loadUser();
  }, []);

  // Fetch post and seller
  useEffect(() => {
    if (!postId) return;
    const fetchPostAndSeller = async () => {
      setLoading(true);
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .maybeSingle();

      if (postError || !postData) {
        console.error(postError);
        setLoading(false);
        return;
      }
      setPost(postData);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email, username")
        .eq("id", postData.user_id)
        .maybeSingle();

      if (profileError || !profileData) {
        console.error(profileError);
        setLoading(false);
        return;
      }
      setSellerEmail(profileData.email);
      setSellerUsername(profileData.username);
      setLoading(false);
    };

    fetchPostAndSeller();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !buyerEmail || !paymentMethod || !pickupLocation || !pickupDate) {
      alert("Please fill in all fields");
      return;
    }
    if (!sellerEmail || !sellerUsername) {
      alert("Seller info missing");
      return;
    }
    if (!post?.availability) {
      alert("This item is no longer available.");
      return;
    }

    try {
      //Insert into order history
      const { error: historyError } = await supabase.from("order_history").insert([{
        post_id: post.id,
        buyer_name: name,
        buyer_email: buyerEmail,
        seller_id: post.user_id,
        seller_email: sellerEmail,
        seller_username: sellerUsername || "",
        price: post.price,
        title: post.title,
        image_url: post.image_url,
        pickup_location: pickupLocation.name,
        pickup_date: pickupDate.toISOString(),
      }]);

      if (historyError) throw historyError;

      //Update availability
      const { data: updatedPost, error: postUpdateError } = await supabase
        .from("posts")
        .update({ availability: false })
        .eq("id", post.id)
        .select()
        .maybeSingle();

      if (postUpdateError) throw postUpdateError;
      setPost(updatedPost); 

      //Send email receipt
      const response = await fetch("http://localhost:5000/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: post.title,
          buyerName: name,
          buyerEmail,
          price: post.price,
          pickupLocation: pickupLocation.name,
          pickupDate: pickupDate.toISOString(),
          sellerEmail,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send email");

      alert("Order successful! Seller has been emailed.");
      navigate("/orderhistory");
    } catch (err) {
      console.error("Order error:", err);
      alert("Failed to complete order. Check console.");
    }
  };

  if (loading) return <p className="text-white p-6">Loading post...</p>;
  if (!post)
    return <p className="text-white p-6">Post not found</p>;

  return (
    <div className="form min-h-screen bg-black p-6 flex flex-col gap-6 text-white">
      <button onClick={() => navigate(-1)} className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-300 w-max">
        Back
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-4 bg-gray-800 p-4 rounded-xl items-center">
          {post.image_url && <img src={post.image_url} alt={post.title} className="w-full h-auto object-cover rounded" />}
          <h1 className="text-3xl font-bold text-yellow-400">{post.title}</h1>
          <p className="text-3xl">${post.price?.toFixed(2)}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 bg-gray-800 p-6 rounded-xl">
          <label className="text-yellow-400 text-3xl">
            Your Name:
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 p-2 rounded text-white" />
          </label>

          <label className="text-yellow-400 text-3xl">
            Your Email:
            <input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} className="w-full mt-1 p-2 rounded text-white" />
          </label>

          <label className="text-yellow-400 text-3xl">
            Payment Method:
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full mt-3 p-2 rounded bg-gray-700 text-white">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </label>

          <label className="z-10 text-yellow-400 text-3xl">
            Pick-up Location:
            <MapContainer center={[39.6393, -86.8636]} zoom={16} style={{ width: "100%", height: "250px", marginTop: "8px" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {locations.map((loc) => (
                <Marker key={loc.name} position={[loc.lat, loc.lng]} icon={pickupLocation?.name === loc.name ? selectedIcon : defaultIcon} eventHandlers={{ click: () => setPickupLocation(loc) }}>
                  <Popup>{loc.name}</Popup>
                </Marker>
              ))}
            </MapContainer>
            {pickupLocation && <p className="mt-3 text-white text-3xl">{pickupLocation.name}</p>}
          </label>

          <label className="relative z-50 text-yellow-400 text-3xl flex flex-col">
            Pick-up Date:
            <DatePicker
              selected={pickupDate}
              onChange={(date) => setPickupDate(date)}
              showTimeSelect
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full mt-3 p-2 rounded text-white border border-gray-700"
              minDate={new Date()}
            />
          </label>

          <button type="submit" className="py-2 px-6 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 w-max mt-4">
            Confirm Order
          </button>
        </form>
      </div>
    </div>
  );
}
