import PostForm from "../components/PostForm";
export default function PostCreate() {
  return (
    <div className="form min-h-screen flex flex-col items-center justify-start bg-black p-6">
      <h1 className="text-4xl font-bold text-yellow-400 mb-6">
        Add a New Post
      </h1>
      <PostForm />
    </div>
  );
}
