"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [price, setPrice] = useState<number | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [amount, setAmount] = useState("0.1");

  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch("https://api.kraken.com/0/public/Ticker?pair=SOLUSD");
        const data = await res.json();
        setPrice(parseFloat(data.result.SOLUSD.c[0]));
      } catch {
        setPrice(null);
      }
    }
    fetchPrice();
    const interval = setInterval(fetchPrice, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white flex flex-col items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <WalletMultiButton />
      </div>
      <h1 className="text-4xl font-bold mb-2">🎰 Degen Echo</h1>
      <p className="text-gray-400 mb-8">Predict SOL. Win big.</p>
      <div className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-md border border-purple-800">
        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm">SOL/USD</p>
          <p className="text-5xl font-bold text-purple-400">
            {price ? `$${price.toFixed(2)}` : "Loading..."}
          </p>
        </div>
        <p className="text-center text-gray-400 mb-4">Where is SOL going this hour?</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "🚀 PUMP", value: "pump" },
            { label: "💀 DUMP", value: "dump" },
            { label: "😴 STAGNATE", value: "stagnate" },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setChoice(btn.value)}
              className={`py-3 rounded-xl font-bold text-sm transition-all ${
                choice === btn.value ? "bg-purple-600 scale-105" : "bg-[#2a2a4a] hover:bg-purple-900"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-1 block">Bet Amount (SOL)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#2a2a4a] rounded-xl px-4 py-3 text-white outline-none"
            min="0.001"
            step="0.001"
          />
        </div>
        {connected ? (
          <div>
            <button className="w-full bg-purple-600 hover:bg-purple-500 py-4 rounded-xl font-bold text-lg transition-all">
              Place Bet {amount} SOL on {choice?.toUpperCase() || "..."}
            </button>
            <p className="text-center text-gray-500 text-xs mt-2">
              {publicKey?.toString().slice(0, 8)}...
            </p>
          </div>
        ) : (
          <div className="text-center text-gray-400">Connect your wallet to bet</div>
        )}
      </div>
    </main>
  );
}
