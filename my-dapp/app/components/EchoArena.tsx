"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  id: number;
  wallet: string;
  text: string;
  created_at: string;
}

interface EchoArenaProps {
  roundId: number | null;
  walletAddress?: string;
}

export default function EchoArena({ roundId, walletAddress }: EchoArenaProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load messages and subscribe to real-time updates
  useEffect(() => {
    if (!open) return;

    // Load existing messages
    async function loadMessages() {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    }
    loadMessages();

    // Real-time subscription
    const channel = supabase
      .channel("chat")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages"
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || !walletAddress || sending) return;
    setSending(true);
    const text = input.trim().slice(0, 200);
    setInput("");
    await supabase.from("chat_messages").insert({
      wallet: walletAddress,
      text,
      round_id: roundId
    });
    setSending(false);
  }

  function formatWallet(w: string) {
    return w.slice(0, 4) + "..." + w.slice(-4);
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl p-4 border border-purple-900 text-center transition-all hover:border-purple-700 mb-3"
        style={{ background: "linear-gradient(135deg,#0d0020,#0a0018)" }}
      >
        <p className="text-purple-300 font-bold text-sm">💬 ECHO ARENA</p>
        <p className="text-gray-500 text-xs mt-1">Live chat during the round</p>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-purple-800 mb-3 overflow-hidden" style={{ background: "linear-gradient(135deg,#0d0020,#0a0018)" }}>
      <div className="flex justify-between items-center px-4 py-3 border-b border-purple-900">
        <p className="text-purple-300 font-bold text-sm">💬 ECHO ARENA</p>
        <button onClick={() => setOpen(false)} className="text-gray-600 text-xs hover:text-gray-400">✕</button>
      </div>

      {/* Messages */}
      <div className="h-48 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <p className="text-gray-600 text-xs text-center mt-6">No messages yet. Be the first!</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="text-xs">
            <span className={`font-bold ${msg.wallet === walletAddress ? "text-purple-400" : "text-pink-400"}`}>
              {msg.wallet === walletAddress ? "You" : formatWallet(msg.wallet)}
            </span>
            <span className="text-gray-600 ml-1">{formatTime(msg.created_at)}</span>
            <p className="text-gray-300 mt-0.5">{msg.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-purple-900">
        {walletAddress ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Say something..."
              maxLength={200}
              className="flex-1 bg-purple-900/20 border border-purple-800 rounded-lg px-3 py-2 text-xs text-white outline-none placeholder-gray-600"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-purple-700 text-white disabled:opacity-40"
            >
              Send
            </button>
          </div>
        ) : (
          <p className="text-gray-600 text-xs text-center">Connect wallet to chat</p>
        )}
      </div>
    </div>
  );
}
