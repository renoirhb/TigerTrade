import PawBlack from "../assets/black.svg";
import PawWhite from "../assets/white.svg";

export default function PostCard({ post, isAdded, onToggle, onOpen }) {
  return (
    <div className="relative bg-black-60 backdrop-blur-md rounded-xl shadow-md p-4 flex flex-col justify-between h-full border border-gray-700 hover:border-yellow-400 transition-all duration-200">

      {/* Image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt={post.title}
          className="w-full h-48 object-cover rounded-lg mb-3 cursor-pointer"
          onClick={onOpen}
        />
      )}

      {/* Title */}
      <h2
        onClick={onOpen}
        className="text-3xl font-bold text-white cursor-pointer hover:text-yellow-400 transition"
      >
        {post.title}
      </h2>

      {/* Price */}
      <p className="text-3xl text-white font-semibold mt-1">
        ${post.price?.toFixed(2)}
      </p>

      {/* Created At */}
      <p className="text-white text-2x1 mt-1">
        Posted at: {new Date(post.created_at).toLocaleDateString()}
      </p>

      {/* Watchlist Button */}
      <button
        onClick={onToggle}
        className="absolute top-2 right-2 w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center p-1 hover:scale-110 transition-transform"
      >
        <img
          src={isAdded ? PawBlack : PawWhite}
          alt="paw"
          className="w-6 h-6"
        />
      </button>
    </div>
  );
}
