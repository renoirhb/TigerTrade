import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  // Fetch profile data
  const fetchProfile = async (currentUser) => {
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }
    return profileData;
  };

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user;

      if (!currentUser) {
        setUser(null);
        return;
      }
      setUser(currentUser);

      const profileData = await fetchProfile(currentUser);
      if (profileData) {
        setProfile(profileData);

        if (!profileData.username) navigate("/user");
      }
    };

    fetchUserAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (session) => {
        if (session?.user) {
          setUser(session.user);
          const profileData = await fetchProfile(session.user);
          if (profileData) setProfile(profileData);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  if (!user)
    return (
      <h2 className="intro flex flex-col items-center p-6 gap-4 text-2xl text-white font-bold">
        Welcome to TigerTrade!
      </h2>
    );

  return (
    <div className="flex flex-col items-center p-6 gap-4">
      <h2 className="intro text-2xl text-white font-bold">
        {profile?.username
          ? `Hi ${profile?.username}, welcome to TigerTrade!`
          : "Welcome to TigerTrade!"}
      </h2>
    </div>
  );
}
