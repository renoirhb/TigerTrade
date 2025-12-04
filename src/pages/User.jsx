import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabaseClient";
import { useNavigate } from "react-router-dom";
import { UserIcon } from "@heroicons/react/24/outline";

export default function User() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [hasUsername, setHasUsername] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      setUser(currentUser);

      try {
        await supabase.from("profiles").insert({ id: currentUser.id }).select();
      } catch (e) {
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (error) console.error(error);
      if (profileData?.username) {
        setHasUsername(true);
        setUsername(profileData.username);
        setTimeout(() => navigate("/"), 500);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleUpdate = async () => {
    if (!user) return;

    const trimmed = username.trim();
    if (!trimmed) {
      setMessage("Username cannot be empty.");
      return;
    }

    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", trimmed)
      .maybeSingle();

    if (checkError) {
      console.error(checkError);
      setMessage("Error checking username.");
      return;
    }

    if (existingUser) {
      setMessage("This username is already used. Please try another one.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ username: trimmed })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Username set successfully!");
      setTimeout(() => navigate("/"), 800);
    }
  };

  if (hasUsername) {
    return (
      <div className="flex flex-col items-center p-6 gap-4 text-white">
        <h2 className="text-2xl font-bold">You’ve already set your username.</h2>
        <p>Redirecting you home...</p>
      </div>
    );
  }

  return (
    <div className="form flex flex-col items-center p-6 gap-4 text-white">
      <h2 className="text-2xl font-bold">Set Your Username</h2>

      <div className="relative w-full max-w-xs">
        <UserIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-white" />
        <input
          type="text"
          placeholder="Enter a username"
          className="p-2 border rounded text-white bg-transparent w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <button
        onClick={handleUpdate}
        className="bg-yellow-400 text-black p-2 rounded hover:bg-yellow-300"
      >
        Save
      </button>

      {message && <p className="text-green-400 mt-2">{message}</p>}
    </div>
  );
}
