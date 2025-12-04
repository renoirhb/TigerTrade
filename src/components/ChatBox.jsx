import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabase/supabaseClient";

export default function ChatBox({ currentUser, recipient, onClose }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [senderId, setSenderId] = useState(null);
  const [recipientId, setRecipientId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const loadUsers = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setSenderId(user.id);
      const { data: rec, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", recipient)
        .single();

      if (error) {
        console.error("Recipient profile error:", error);
        return;
      }
      setRecipientId(rec.id);
      const newRoomId = [user.id, rec.id].sort().join("-");
      setRoomId(newRoomId);
    };
    loadUsers();
  }, [recipient]);

  useEffect(() => {
    if (!roomId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) console.error("Fetch error:", error);
      else setMessages(data || []);
    };
    fetchMessages();
  }, [roomId]);

  useEffect(() => {
  if (!roomId) return;

  const channel = supabase
    .channel(`room-${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const msg = payload.new;
        if (msg.room_id === roomId) {
          setMessages((prev) => [...prev, msg]);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [roomId]);

  const handleSend = async () => {
    if (!messageText.trim()) return;
    if (!senderId || !recipientId || !roomId) return;

    const newMessage = {
      sender: currentUser,
      recipient: recipient,
      content: messageText.trim(),
      sender_id: senderId,
      recipient_id: recipientId,
      room_id: roomId,
    };

    const { error } = await supabase
      .from("messages")
      .insert([newMessage])
      .select();

    if (error) {
      console.error("Send error:", error);
      return;
    }

    setMessageText("");
  };

  return (
    <div className="form fixed bottom-17 right-6 w-80 bg-gray-900 rounded-lg shadow-lg p-4 z-50">
      {/* Header */}
      <div className="font-bold text-yellow-400 mb-2 flex justify-between items-center">
        <span>{recipient}</span>
        <button onClick={onClose} className="text-white hover:text-yellow-400">
          ✕
        </button>
      </div>

      {/* Chat Frame */}
      <div className="form fixed bottom-17 right-6 w-96 h-96 bg-gray-900 rounded-lg shadow-lg p-4 z-50 flex flex-col">
        <div className="font-bold text-yellow-400 mb-2 flex justify-between items-center">
          <span>{recipient}</span>
          <button onClick={onClose} className="text-white hover:text-yellow-400">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-2 flex flex-col gap-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded max-w-[75%] ${
                msg.sender === currentUser
                  ? "bg-yellow-400 text-black self-end"
                  : "bg-gray-700 text-white self-start"
              }`}
            >
              {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-1 px-2 py-1 rounded bg-gray-800 text-white focus:outline-none resize-none overflow-hidden text-left align-top"
            placeholder="Type a message..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{
              lineHeight: "1.4rem",
              maxHeight: "150px",
              verticalAlign: "top",
            }}
            ref={(el) => {
              if (el) {
                el.style.height = "auto";
                el.style.height = el.scrollHeight + "px";
              }
            }}
          />
          <button
            onClick={handleSend}
            className="bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-300"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}