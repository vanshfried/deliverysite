import React, { useState, useContext } from "react";
import styles from "./css/OrderChatBot.module.css";
import API from "../../../api/api";

// Assuming you have some AuthContext or UserContext that stores the logged-in user
import { AuthContext } from "../../admin/Context/AuthContext";

export default function OrderChatBot({ order }) {
  const { user } = useContext(AuthContext); // frontend user object with name and phone
  const [messages, setMessages] = useState([
    { from: "bot", text: `HI ${user?.name}! How can I help you with your order?` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { from: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // send user info to backend along with order
      const res = await API.post("/api/order-chat", {
        message: input,
        order,
        conversation: newMessages,
        userInfo: {
          name: user?.name || "Customer",
          phone: user?.phone || "Unknown",
        },
      });

      const data = res.data;
      const reply = data.reply || "Sorry, I couldn't get an answer.";

      setMessages([...newMessages, { from: "bot", text: reply }]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        { from: "bot", text: "Sorry, something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messages}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.from === "bot" ? styles.botMessage : styles.userMessage}
          >
            {m.text}
          </div>
        ))}
        {loading && <div className={styles.botMessage}>Typing...</div>}
      </div>

      <div className={styles.inputContainer}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me about your order..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
