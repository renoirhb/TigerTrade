import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabaseClient";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;
      setUser(data.user);

      // Load profile
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!error && profileData) {
        setProfile(profileData);
        setUsername(profileData.username || ""); // prefill input
      }
    };
    fetchUser();
  }, []);

  const handleChangeUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setMessage("Username cannot be empty.");
      return;
    }
    // Check if username is taken
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

    if (existingUser && existingUser.id !== user.id) {
      setMessage("This username is already used. Please try another one.");
      return;
    }

    // Update username
    const { error } = await supabase
      .from("profiles")
      .update({ username: trimmed })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Username updated successfully!");
      setProfile((prev) => ({ ...prev, username: trimmed }));
    }
  };
  if (!user) return <p className="text-white">Loading...</p>;

  return (
    <div className="form flex flex-col items-center p-6 gap-4">

      <div className="bg-white/20 text-white rounded-lg shadow-lg p-6 w-80 flex flex-col gap-4 backdrop-blur-md">
        <h3 className="intro text-lg font-bold border-b border-white/50 pb-2">User Details</h3>
        <p>
          <span className="font-semibold">Username: </span>
          {profile?.username || "Not set"}
        </p>

        <p>
          <span className="font-semibold">Email: </span>
          {user.email}
        </p>

        <div className="flex flex-col gap-2 mt-2">
          <input
            type="text"
            placeholder="Enter new username"
            className="p-2 rounded bg-gray-800 text-white focus:outline-none w-full"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            onClick={handleChangeUsername}
            className="bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-300"
          >
            Update Username
          </button>
          {message && <p className="text-green-400 mt-1">{message}</p>}
        </div>
      </div>
    </div>
  );
}
