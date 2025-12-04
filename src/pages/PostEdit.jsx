import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import { PencilIcon } from "@heroicons/react/24/solid";

export default function PostEdit() {
  const location = useLocation();
  const navigate = useNavigate();

  const postToEdit = location.state?.postToEdit || null;
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState(postToEdit || {});
  const [loading, setLoading] = useState(false);

  if (!postToEdit)
    return <p className="text-center text-white mt-10">Post not found</p>;

  // Upload image to Supabase Storage
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const fileName = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(`public/${fileName}`, file);

    if (uploadError) {
      alert("Image upload failed: " + uploadError.message);
      setLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("post-images")
      .getPublicUrl(`public/${fileName}`);

    const newUrl = publicUrlData.publicUrl;
    setFormData((prev) => ({ ...prev, image_url: newUrl }));
    setLoading(false);
  };

  // Save all edited fields
  const handleSaveAll = async () => {
    if (!postToEdit?.id) {
      alert("Error: Missing post ID.");
      console.error("Missing postToEdit:", postToEdit);
      return;
    }
    setLoading(true);
    const postId = Number(postToEdit.id);

    const updateData = {
      title: formData.title?.trim(),
      description: formData.description?.trim(),
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      image_url: formData.image_url,
      status: formData.status || postToEdit.status,
    };

    const { data, error } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", postId)
      .select();

    if (error) {
      console.error(" Supabase update error:", error);
      alert("Update failed: " + error.message);
    } else if (data && data.length > 0) {
      navigate("/mypost");
    } else {
      alert("No rows were updated. Please check your post ID or permissions.");
    }
    setLoading(false);
  };

  // Upload (change status to 'uploaded')
  const handleUploadPost = async () => {
    if (!postToEdit?.id) {
      alert("Error: Missing post ID.");
      return;
    }
    setLoading(true);
    const postId = Number(postToEdit.id);

    const { data, error } = await supabase
      .from("posts")
      .update({ status: "uploaded" })
      .eq("id", postId)
      .select();

    if (error) {
      console.error(" Upload error:", error);
      alert("Failed to upload post: " + error.message);
    } else if (data && data.length > 0) {
      navigate("/mypost");
    } else {
      alert(" No post was updated — check your permissions or post ID.");
    }
    setLoading(false);
  };

  return (
    <div className="form max-w-md mx-auto mt-8">
      {/* Header */}
      <h1 className="text-4xl font-bold mb-4 text-center text-yellow-300">
        Edit Post
      </h1>

      <div className="p-6 bg-black/60 backdrop-blur-md rounded-xl shadow-xl text-white border border-white">
        {/* Image */}
        <div className="mb-6 flex flex-col items-center">
          <label className="text-3xl text-yellow-300 font-semibold mb-2">
            Image:
          </label>

          <div className="flex items-center gap-3">
            {formData.image_url && (
              <img
                src={formData.image_url}
                alt="Post"
                className="w-40 h-40 object-cover rounded border border-gray-500"
              />
            )}
            <PencilIcon
              className="cursor-pointer text-yellow-400 h-5 w-5 hover:text-yellow-300 transition"
              onClick={() =>
                setEditingField(editingField === "image" ? null : "image")
              }
            />
          </div>
          {editingField === "image" && (
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-white mt-3"
            />
          )}
        </div>

        {/* Title */}
        <div className="mb-4 pb-4 flex items-start justify-between">
          <div className="flex-1">
            <label className="text-3xl text-yellow-300 font-semibold">
              Title:
            </label>
            {editingField === "title" ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className=" p-2 rounded bg-black/30 border border-gray-600 text-white w-full"
              />
            ) : (
              <p>{formData.title}</p>
            )}
          </div>
          <PencilIcon
            className="cursor-pointer text-yellow-400 mt-1 h-5 w-5"
            onClick={() =>
              setEditingField(editingField === "title" ? null : "title")
            }
          />
        </div>

        {/* Description */}
        <div className="mb-4 flex items-start justify-between pt-2 pb-2">
          <div className="flex-1">
            <label className="text-3xl text-yellow-300 font-semibold mb-1">
              Description:
            </label>
            {editingField === "description" ? (
              <select
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="p-2 rounded bg-black/30 border border-gray-600 text-white"
              >
                <option value="None">None</option>
                <option value="New">New</option>
                <option value="Likely New">Likely New</option>
                <option value="New with packaging">New with packaging</option>
                <option value="Used">Used</option>
              </select>
            ) : (
              <p className="pt-2 pb-2">{formData.description}</p>
            )}
          </div>
          <PencilIcon
            className="cursor-pointer text-yellow-400 mt-1 h-5 w-5"
            onClick={() =>
              setEditingField(
                editingField === "description" ? null : "description"
              )
            }
          />
        </div>

        {/* Category */}
        <div className="mb-4 pb-4 flex items-start justify-between">
          <div className="flex-1">
            <label className="text-3xl text-yellow-300 font-semibold">
              Category:
            </label>
            {editingField === "category" ? (
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="p-2 rounded bg-black/30 border border-gray-600 text-white"
              >
                <option value="All">All</option>
                <option value="beddings">Beddings</option>
                <option value="books">Books</option>
                <option value="clothing">Clothing</option>
                <option value="cooking appliance">Cooking Appliances</option>
                <option value="decorations">Decorations</option>
                <option value="electronics">Electronics</option>
                <option value="furniture">Furniture</option>
                <option value="writing supplies">Writing Supplies</option>
              </select>
            ) : (
              <p>{formData.category}</p>
            )}
          </div>
          <PencilIcon
            className="cursor-pointer text-yellow-400 mt-1 h-5 w-5"
            onClick={() =>
              setEditingField(editingField === "category" ? null : "category")
            }
          />
        </div>

        {/* Price */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <label className="text-3xl text-yellow-300 font-semibold">
              Price ($):
            </label>
            {editingField === "price" ? (
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="p-2 rounded bg-black/30 border border-gray-600 text-white w-full"
              />
            ) : (
              <p>${formData.price}</p>
            )}
          </div>
          <PencilIcon
            className="cursor-pointer text-yellow-400 mt-1 h-5 w-5"
            onClick={() =>
              setEditingField(editingField === "price" ? null : "price")
            }
          />
        </div>

        {/* Save all changes */}
        <button
          onClick={handleSaveAll}
          disabled={loading}
          className="w-full bg-yellow-400 text-black py-2 rounded hover:bg-yellow-300 transition mb-3 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save All Changes"}
        </button>

        {/* Upload button */}
        <button
          onClick={handleUploadPost}
          disabled={loading}
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-400 transition disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Post"}
        </button>
      </div>
    </div>
  );
}
