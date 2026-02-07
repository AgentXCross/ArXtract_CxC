import { useState, useRef, useEffect } from "react";
import "../App.css";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  arxivId: string;
}

export default function ChatPanel({ arxivId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingIndex, setTypingIndex] = useState<number | null>(null);
  const [displayedChars, setDisplayedChars] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, displayedChars]);

  // Typewriter effect
  useEffect(() => {
    if (typingIndex === null) return;
    const msg = messages[typingIndex];
    if (!msg) return;

    const fullLength = msg.content.length;
    if (displayedChars >= fullLength) {
      setTypingIndex(null);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedChars(prev => Math.min(prev + 2, fullLength));
    }, 12);

    return () => clearTimeout(timer);
  }, [typingIndex, displayedChars, messages]);

  async function handleSend() {
    const query = input.trim();
    if (!query || loading) return;
    if (!arxivId.trim()) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: query }]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/paper/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arxiv_id: arxivId, query }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response.");
      }

      const data = await res.json();
      setMessages(prev => {
        const newMessages = [...prev, { role: "assistant" as const, content: data.answer }];
        setTypingIndex(newMessages.length - 1);
        setDisplayedChars(0);
        return newMessages;
      });
    } catch {
      setMessages(prev => {
        const newMessages = [...prev, { role: "assistant" as const, content: "Something went wrong. Please try again." }];
        setTypingIndex(newMessages.length - 1);
        setDisplayedChars(0);
        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  }

  const mono = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

  function getDisplayContent(msg: ChatMessage, index: number) {
    if (msg.role === "assistant" && index === typingIndex) {
      return msg.content.slice(0, displayedChars);
    }
    return msg.content;
  }

  const isTyping = typingIndex !== null;

  return (
    <div
      style={{
        marginTop: "1.25rem",
        background: "#0f0f0f",
        border: "1px solid #2a2a2a",
        borderRadius: 10,
        overflow: "hidden",
        fontFamily: mono,
        transition: "box-shadow 0.3s ease, border-color 0.3s ease",
        display: "flex",
        flexDirection: "column",
        height: 500,
        alignItems: "left"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 0 5px rgba(199, 255, 0, 0.6)";
        e.currentTarget.style.borderColor = "#c7ff00";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "#2a2a2a";
      }}
    >
      {/* Title bar */}
      <div
        style={{
          background: "#c7ff00",
          padding: "0.5rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: "0.35rem" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#000" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#000" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#000" }} />
        </div>
        <div style={{
          fontSize: "0.75rem",
          color: "#000",
          textTransform: "lowercase",
          letterSpacing: "0.03em",
          fontWeight: 600,
        }}>
          research_query
        </div>
      </div>

      {/* Messages area */}
      <div ref={messagesContainerRef} style={{
        flex: 1,
        overflowY: "auto",
        padding: "1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}>
        {messages.length === 0 && (
          <p style={{
            opacity: 0.5,
            fontSize: "0.85rem",
            textAlign: "center",
            marginTop: "2rem",
          }}>
            Ask a question about the paper...
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div style={{
              maxWidth: "75%",
              padding: "0.75rem 1rem",
              borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              background: msg.role === "user" ? "#1a2a0a" : "#1a1a1a",
              border: msg.role === "user" ? "1px solid #3a5a1a" : "1px solid #333",
              color: msg.role === "user" ? "#c7ff00" : "#ddd",
              fontSize: "0.85rem",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}>
              {getDisplayContent(msg, i)}
              {msg.role === "assistant" && i === typingIndex && (
                <span style={{
                  display: "inline-block",
                  width: "0.5em",
                  height: "1em",
                  background: "#c7ff00",
                  marginLeft: "2px",
                  verticalAlign: "text-bottom",
                  animation: "cursor-blink 0.7s step-end infinite",
                }} />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "0.75rem 1rem",
              borderRadius: "12px 12px 12px 2px",
              background: "#1a1a1a",
              border: "1px solid #333",
              color: "#888",
              fontSize: "0.85rem",
            }}>
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{
        flexShrink: 0,
        padding: "0.75rem 1rem",
        borderTop: "1px solid #2a2a2a",
        display: "flex",
        gap: "0.5rem",
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          placeholder="Ask about the paper..."
          className="terminal-input"
          style={{
            flex: 1,
            padding: "0.6rem 0.75rem",
            borderRadius: 0,
            border: "none",
            borderBottom: "1px solid #333",
            background: "transparent",
            color: "#ccff00",
            fontFamily: mono,
            fontSize: "0.85rem",
            outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim() || isTyping}
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: 8,
            border: "none",
            background: loading || !input.trim() || isTyping ? "#333" : "linear-gradient(135deg, #ccff00, #39ff14)",
            color: "#000",
            fontWeight: 700,
            fontSize: "0.85rem",
            fontFamily: mono,
            cursor: loading || !input.trim() || isTyping ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() || isTyping ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
