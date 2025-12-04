import { BrowserRouter as Router, Routes, Route, useNavigate, NavLink } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase/supabaseClient";
import { DocumentPlusIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import ChatPreview from "./components/ChatPreview";

import Buy from "./pages/Buy";
import OrderHistory from "./pages/OrderHistory";
import Home from "./pages/Home";
import Post from "./pages/Post";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";
import Watchlist from "./pages/Watchlist";
import Profile from "./pages/Profile";
import User from "./pages/User";
import About from "./pages/About";
import PostCreate from "./pages/PostCreate";
import PostDetail from "./pages/PostDetail";
import MyPost from "./pages/MyPost";
import PostEdit from "./pages/PostEdit";
import Feedback from "./pages/Feedback";
import SellerProfile from "./pages/SellerProfile"
import "./App.css";



export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post" element={<Post />} />
        <Route path="/list" element={<Watchlist />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/user" element={<User />} />
        <Route path="/about" element={<About />} />
        <Route path="/create" element={<PostCreate />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/mypost" element={<MyPost />} />
        <Route path="/editpost" element={<PostEdit />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/orderhistory" element={<OrderHistory />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/seller/:sellerId" element={<SellerProfile />} />

      </Routes>
      <ChatButton />
    </Router>
  );
}

function ChatButton() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleClick = () => {
    if (!user) navigate("/signin");
    else setChatOpen((prev) => !prev);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="form fixed bottom-6 right-8 flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-full shadow-lg z-50"
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
        Chat
      </button>

      {chatOpen && user && (
        <ChatPreview currentUser={user.email || user.id} onClose={() => setChatOpen(false)} />
      )}
    </>
    
  );
}

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const dropdownRef = useRef(null);

  // Fetch current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOpen(false);
    navigate("/signin");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/post?search=${encodeURIComponent(searchQuery)}`);
    setSearchQuery("");
    setSearchOpen(false);
  };

  return (
    <nav className="bg-black px-8 py-3 border-1 rounded-lg relative">
      <div className="flex items-center justify-between w-full">
        <div className="logo text-white font-bold text-xl">TigerTrade</div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex items-center">
            {searchOpen && (
              <form onSubmit={handleSearchSubmit} className="absolute right-10">
                <input
                  type="text"
                  placeholder="Search item"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form pl-3 pr-3 py-1 rounded-l-lg bg-black border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 w-48"
                />
              </form>
            )}
            <button
              onClick={() => setSearchOpen((prev) => !prev)}
              className="text-white hover:text-yellow-400"
              title="Search"
            >
              <MagnifyingGlassIcon className="h-8 w-8" />
            </button>
          </div>

          {/* Add Post */}
          <button
            onClick={() => (!user ? navigate("/signin") : navigate("/create"))}
            className="text-white hover:text-yellow-400"
            title="Create Post"
          >
            <DocumentPlusIcon className="h-8 w-8" />
          </button>

          {/* Avatar */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => {
                if (!user) {
                  navigate("/signin");
                  setOpen(false);
                  return; // stop further execution
                }
                setOpen((prev) => !prev);
              }}
              className="text-5xl text-white hover:text-yellow-400"
              title={user ? "Account" : "Sign In"}
            >
              <FaUserCircle />
            </button>

            {open && user && (
              <div className="option absolute right-0 top-12 w-40 bg-white border rounded shadow-lg flex flex-col z-50">
                <button
                  onClick={() => { navigate("/profile"); setOpen(false); }}
                  className="px-4 py-2 text-black hover:bg-gray-300 text-left border-b border-black"
                >
                  Profile
                </button>
                <button
                  onClick={() => { navigate("/mypost"); setOpen(false); }}
                  className="px-4 py-2 text-black hover:bg-gray-300 text-left border-b border-black"
                >
                  My Post
                </button>
                <button
                  onClick={() => { navigate("/orderhistory"); setOpen(false); }}
                  className="px-4 py-2 text-black hover:bg-gray-300 text-left border-b border-black"
                >
                  Order History
                </button>
                <button
                  onClick={() => { navigate("/about"); setOpen(false); }}
                  className="px-4 py-2 text-black hover:bg-gray-300 text-left border-b border-black"
                >
                  About Us
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-black hover:bg-gray-300 text-left"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center: Nav links */}
      <div className="tab absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-16">
        <NavLink to="/" className="text-white hover:underline">
          Home
        </NavLink>
        <NavLink to="/post" className="text-white hover:underline">
          Posts
        </NavLink>
        <NavLink to="/list" className="text-white hover:underline">
          Watchlist
        </NavLink>
      </div>
    </nav>
  );
}