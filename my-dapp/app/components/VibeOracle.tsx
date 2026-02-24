"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const RAKE_WALLET = new PublicKey("9pWyRYfKahQZPTnNMcXhZDDsUV75mHcb2ZpxGqzZsHnK");
const ORACLE_FEE = 0.005;

const TIERS = [
  { value: "bigpump", label: "🚀 Big Pump", color: "text-green-400" },
  { value: "smallpump", label: "📈 Small Pump", color: "text-emerald-400" },
  { value: "stagnate", label: "😴 Stagnate", color: "text-yellow-400" },
  { value: "smalldump", label: "📉 Small Dump", color: "text-orange-400" },
  { value: "bigdump", label: "💀 Big Dump", color: "text-red-400" },
];

interface VibeOracleProps {
  price: number | null;
  hourOpen: number | null;
  timeLeft: string;
  tierCounts: Record<string, number>;
  pot: number;
}

export default function VibeOracle({ price, hourOpen, timeLeft, tierCounts, pot }: VibeOracleProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oracle, setOracle] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();

  async function consultOracle() {
    if (!connected || !publicKey) {
      setError('Connect your wallet to use the Oracle.');
      return;
    }
    setLoading(true);
    setError(null);
    setOracle(null);

    try {
      const lamports = Math.floor(ORACLE_FEE * LAMPORTS_PER_SOL);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: RAKE_WALLET,
          lamports,
        })
      );
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      const sig = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(sig, 'confirmed');

      const res = await fetch('/api/vibe-oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, hourOpen, timeLeft, tierCounts, pot })
      });
      const data = await res.json();
      if (data.ok) {
        setOracle(data.oracle);
      } else {
        setError('Oracle failed to respond. Try again.');
      }
    } catch (e: any) {
      setError(e.message?.includes('rejected') ? 'Transaction cancelled.' : 'Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl p-4 border border-pink-800 text-center transition-all hover:border-pink-600 mb-3"
        style={{ background: "linear-gradient(135deg,#1a0020,#0d0018)" }}
      >
        <p className="text-pink-300 font-bold text-sm">🔮 VIBE ORACLE</p>
        <p className="text-gray-500 text-xs mt-1">AI probability co-pilot · small fee per use</p>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-pink-800 mb-3 overflow-hidden" style={{ background: "linear-gradient(135deg,#1a0020,#0d0018)" }}>
      <div className="flex justify-between items-center px-4 py-3 border-b border-pink-900">
        <div>
          <p className="text-pink-300 font-bold text-sm">🔮 VIBE ORACLE</p>
          <p className="text-gray-600 text-xs">AI-powered prediction co-pilot</p>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-600 text-xs hover:text-gray-400">✕</button>
      </div>

      <div className="p-4">
        {!oracle && !loading && (
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-2 leading-relaxed">
              The Oracle reads live SOL price action, round timing, and current bets to give you an AI probability breakdown for each tier.
            </p>
            <p className="text-pink-400 text-xs font-bold mb-4">A small fee applies per consultation.</p>
            {!connected && (
              <p className="text-yellow-500 text-xs mb-3">Connect your wallet to use the Oracle.</p>
            )}
            <button
              onClick={consultOracle}
              disabled={!connected}
              className={`w-full py-3 rounded-xl font-black text-sm transition-all ${
                connected
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-500 hover:to-purple-500'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              🔮 Consult the Oracle
            </button>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </div>
        )}

        {loading && (
          <div className="text-center py-6">
            <p className="text-pink-400 text-sm animate-pulse font-bold">🔮 Reading the vibes...</p>
          </div>
        )}

        {oracle && (
          <div className="space-y-3">
            <div className="bg-pink-900/20 rounded-xl p-3">
              <p className="text-pink-300 text-xs leading-relaxed">{oracle.summary}</p>
            </div>
            {oracle.warning && (
              <div className="bg-yellow-900/20 rounded-xl p-2">
                <p className="text-yellow-400 text-xs">⚠️ {oracle.warning}</p>
              </div>
            )}
            <div className="space-y-2">
              {TIERS.map(tier => {
                const pct = oracle.probabilities?.[tier.value] || 0;
                const isTop = oracle.topPick === tier.value;
                return (
                  <div key={tier.value} className={`rounded-lg p-2 ${isTop ? 'bg-pink-900/30 border border-pink-700' : 'bg-purple-900/10'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-bold ${tier.color}`}>
                        {tier.label} {isTop ? '← Oracle pick' : ''}
                      </span>
                      <span className="text-white text-xs font-black">{pct}%</span>
                    </div>
                    <div className="w-full bg-purple-900/30 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-600 text-xs">Oracle confidence</span>
              <span className={`text-xs font-bold ${
                oracle.confidence === 'high' ? 'text-green-400' :
                oracle.confidence === 'medium' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {oracle.confidence?.toUpperCase()}
              </span>
            </div>
            <button
              onClick={consultOracle}
              disabled={!connected}
              className="w-full py-2 rounded-xl text-xs font-bold border border-pink-800 text-pink-400 hover:bg-pink-900/30 transition-all"
            >
              🔮 Refresh Oracle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
