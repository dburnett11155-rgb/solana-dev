"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  wallet: string;
  text: string;
  time: string;
}

interface EchoArenaProps {
  roundId: number | null;
  walletAddress?: string;
}

export default function EchoArena({ roundId, walletAddress }: EchoArenaProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"voice" | "chat">("chat");
  const [messages, setMessages] = useState<Message[]>([
    { wallet: "Degen7x", text: "SOL going up this hour fr fr 🚀", time: "just now" },
    { wallet: "Whale3k", text: "stagnate is the play rn", time: "2m ago" },
    { wallet: "Moon9z", text: "big pump or bust 💀", time: "4m ago" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, tab]);

  function sendMessage() {
    if (!input.trim()) return;
    const wallet = walletAddress
      ? walletAddress.slice(0, 4) + "..." + walletAddress.slice(-4)
      : "You";
    setMessages(prev => [...prev, { wallet, text: input.trim(), time: "just now" }]);
    setInput("");
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") sendMessage();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl p-4 border border-purple-800 text-center transition-all hover:border-purple-600 mb-3"
        style={{ background: "linear-gradient(135deg,#0d0020,#120025)" }}
      >
        <p className="text-purple-300 font-bold text-sm">🎙️ ECHO ARENA</p>
        <p className="text-gray-500 text-xs mt-1">Live voice + chat during the round</p>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-purple-700 mb-3 overflow-hidden" style={{ background: "linear-gradient(135deg,#0d0020,#120025)" }}>
      
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-purple-900">
        <p className="text-purple-300 font-bold text-sm">🎙️ ECHO ARENA</p>
        <button onClick={() => setOpen(false)} className="text-gray-600 text-xs hover:text-gray-400">✕</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-purple-900">
        <button
          onClick={() => setTab("chat")}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${
            tab === "chat" ? "text-purple-300 border-b-2 border-purple-500" : "text-gray-600"
          }`}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setTab("voice")}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${
            tab === "voice" ? "text-purple-300 border-b-2 border-purple-500" : "text-gray-600"
          }`}
        >
          🎙️ Voice
        </button>
      </div>

      {/* Chat tab */}
      {tab === "chat" && (
        <div>
          <div className="h-48 overflow-y-auto px-3 py-2 space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-purple-400 text-xs font-bold shrink-0">{msg.wallet}</span>
                <span className="text-gray-300 text-xs">{msg.text}</span>
                <span className="text-gray-700 text-xs shrink-0 ml-auto">{msg.time}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2 px-3 py-2 border-t border-purple-900">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Say something..."
              className="flex-1 bg-purple-900/30 border border-purple-800 rounded-lg px-3 py-2 text-white text-xs outline-none"
            />
            <button
              onClick={sendMessage}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-2 rounded-lg"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Voice tab */}
      {tab === "voice" && (
        <div className="px-4 py-4 text-center">
          <p className="text-purple-400 text-sm font-bold mb-2">🎙️ Voice rooms</p>
          <p className="text-gray-500 text-xs mb-4">Coming soon — voice during rounds</p>
          <div className="bg-purple-900/20 rounded-xl p-3">
            <p className="text-gray-600 text-xs">Switch to Chat tab to talk now!</p>
          </div>
        </div>
      )}

    </div>
  );
}
