import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function PostForm() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("None");
  const [category, setCategory] = useState("All");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) navigate("/signin");
      else setUser(data.user);
    };
    fetchUser();
  }, [navigate]);

  const validate = () => {
    const newErrors = {};
    const titleWords = title.trim().split(/\s+/);
    const hasLetters = /[a-zA-Z]/.test(title);
    if (!title || titleWords.length < 2 || !hasLetters) {
      newErrors.title = "The title is not valid. Try again";
    }
    if (!description || description === "None") newErrors.category = "Please select a description for your item";
    if (!category || category === "All") newErrors.category = "Please select a category";
    if (!price || parseFloat(price) <= 0) newErrors.price = "Price is not valid. Try again.";
    if (!imageFile) newErrors.imageFile = "Please upload an image";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status) => {
    if (!user) {
      navigate("/signin");
      return;
    }
    if (status === "uploaded" && !validate()) return;
    setLoading(true);
    let imageUrl = null;

    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(`public/${fileName}`, imageFile);

      if (uploadError) {
        alert("Image upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(`public/${fileName}`);

      imageUrl = publicUrlData.publicUrl;
    }

    const { error: insertError } = await supabase.from("posts").insert([
      {
        user_id: user.id,
        email: user.email,
        title,
        description,
        category,
        price: parseFloat(price),
        image_url: imageUrl,
        status, // "uploaded" or "draft"
      },
    ]);

    if (insertError) {
      alert("Post insert error: " + insertError.message);
      setLoading(false);
      return;
    }

    setTitle("");
    setDescription("None");
    setCategory("All");
    setPrice("");
    setImageFile(null);
    setLoading(false);
    navigate("/post");
  };

  if (!user)
    return <p className="text-white text-center">Loading user information...</p>;

  return (
    <form className=" max-w-md mx-auto p-8 bg-black/60 backdrop-blur-md rounded-xl shadow-xl flex flex-col gap-6 text-white border border-white mt-3">
      {/* Image Upload */}
      <div className="flex flex-col">
        <label className="mb-1 text-3xl font-semibold text-yellow-300">Upload Image</label>

        {/* File input */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            setImageFile(file);

          if (file) {
            const previewURL = URL.createObjectURL(file);
          setPreviewUrl(previewURL);
          }
        }}
        className="text-white mt-2"
      />

        {/* Preview image */}
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-40 h-40 object-cover rounded border border-gray-500 mt-3"
          />
        )}
        {errors.imageFile && (
          <p className="text-[18px] text-red-400 mt-1">{errors.imageFile}</p>
        )}
      </div>

      {/* Title */}
      <div className="flex flex-col">
        <label className="text-3xl mb-1 font-semibold text-yellow-300">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-2 p-2 rounded border border-gray-600 bg-black/30 placeholder-gray-400 text-white"
        />
        {errors.title && <p className="text-[18px] text-red-400 mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div className="flex flex-col">
        <label className="text-3xl mb-1 font-semibold text-yellow-300">Description</label>
        <select
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-2 p-2 rounded border border-gray-600 bg-black/30 text-white"
        >
          <option value="None">None</option>
          <option value="New">New</option>
          <option value="Likely New">Likely New</option>
          <option value="New with packaging">New with packaging</option>
          <option value="Used">Used</option>
        </select>
        {errors.description && <p className="text-[18px] text-red-400 mt-1">{errors.description}</p>}
      </div>

      {/* Category */}
      <div className="flex flex-col">
        <label className="text-3xl mb-1 font-semibold text-yellow-300">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-2 p-2 rounded border border-gray-600 bg-black/30 text-white"
        >
          <option value="All">All</option>
          <option value="Beddings">Beddings</option>
          <option value="Books">Books</option>
          <option value="Clothing">Clothing</option>
          <option value="Cooking Appliances">Cooking Appliances</option>
          <option value="Decorations">Decorations</option>
          <option value="Electronics">Electronics</option>
          <option value="Furniture">Furniture</option>
          <option value="Writing Supplies">Writing Supplies</option>
          <option value="Other">Other</option>
        </select>
        {errors.category && <p className="text-[18px] text-red-400 mt-1">{errors.category}</p>}
      </div>

      {/* Price */}
      <div className="flex flex-col">
        <label className="text-3xl mb-1 font-semibold text-yellow-300">Price ($)</label>
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          className="mt-2 p-2 rounded border border-gray-600 bg-black/30 placeholder-gray-400 text-white"
        />
        {errors.price && <p className="text-[18px] text-red-400 mt-1">{errors.price}</p>}
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-4">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit("uploaded")}
          className="flex-1 bg-yellow-400 text-black font-semibold py-2 rounded hover:bg-yellow-300 transition"
        >
          {loading ? "Posting..." : "Upload"}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit("draft")}
          className="flex-1 bg-gray-600 text-white font-semibold py-2 rounded hover:bg-gray-500 transition"
        >
          {loading ? "Saving..." : "Save as Draft"}
        </button>
      </div>
    </form>
  );
}
