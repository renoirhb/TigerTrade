import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import ChatBox from "./ChatBox";

export default function ChatPreview({ currentUser, onClose }) {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const formatDate = (utc) => {
    return new Date(utc).toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Indiana/Indianapolis",
    });
  };

  // Fetch chat list
  const fetchChats = async () => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender.eq.${currentUser},recipient.eq.${currentUser}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching chats:", error);
      return;
    }

    const chatMap = {};
    data.forEach((msg) => {
      const partner = msg.sender === currentUser ? msg.recipient : msg.sender;

      if (
        !chatMap[partner] ||
        new Date(chatMap[partner].created_at) < new Date(msg.created_at)
      ) {
        chatMap[partner] = msg;
      }
    });

    setChats(
      Object.values(chatMap).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )
    );
  };

  useEffect(() => {
    fetchChats();

    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;

          if (msg.sender === currentUser || msg.recipient === currentUser) {
            const partner =
              msg.sender === currentUser ? msg.recipient : msg.sender;

            setChats((prev) => {
              const filtered = prev.filter((c) => {
                const cPartner =
                  c.sender === currentUser ? c.recipient : c.sender;
                return cPartner !== partner;
              });

              return [msg, ...filtered];
            });
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser]);

  if (activeChat)
    return (
      <ChatBox
        currentUser={currentUser}
        recipient={activeChat}
        onClose={() => setActiveChat(null)}
      />
    );

  return (
    <div className="form fixed bottom-24 right-6 w-80 bg-gray-900 rounded-lg shadow-lg p-4 z-50">
      <div className="flex justify-between items-center mb-2">
        <div className="text-2xl font-bold text-yellow-400">Messages</div>
        <button onClick={onClose} className="text-white hover:text-yellow-400">
          ✕
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto flex flex-col gap-2">
        {chats.length === 0 && (
          <div className="text-gray-400 text-center py-4">
            No messages yet.
          </div>
        )}

        {chats.map((msg) => {
          const partner =
            msg.sender === currentUser ? msg.recipient : msg.sender;

          return (
            <button
              key={msg.id}
              onClick={() => setActiveChat(partner)}
              className="text-left p-2 rounded hover:bg-gray-700 flex flex-col"
            >
              <div className="flex justify-between">
                <span className="font-semibold text-white">{partner}</span>

                {/* Timestamp */}
                <span className="text-gray-400 text-lg">
                  {formatDate(msg.created_at)}
                </span>
              </div>

              <span className="text-gray-300 truncate">{msg.content}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
