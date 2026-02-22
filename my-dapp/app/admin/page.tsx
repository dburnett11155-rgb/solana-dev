"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const TIERS: Record<string, string> = {
  bigpump: "🚀 Big Pump",
  smallpump: "📈 Small Pump",
  stagnate: "😴 Stagnate",
  smalldump: "📉 Small Dump",
  bigdump: "💀 Big Dump",
};

export default function AdminPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const [selectedRound, setSelectedRound] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: roundData } = await supabase
      .from("rounds")
      .select("*")
      .order("id", { ascending: false })
      .limit(20);
    setRounds(roundData || []);
    setLoading(false);
  }

  async function loadRoundBets(round: any) {
    setSelectedRound(round);
    const { data: betData } = await supabase
      .from("bets")
      .select("*")
      .eq("round_id", round.id)
      .order("amount", { ascending: false });
    setBets(betData || []);

    if (round.winning_tier && betData) {
      const winners = betData.filter((b: any) => b.tier === round.winning_tier);
      const totalWinning = winners.reduce((sum: number, b: any) => sum + b.amount, 0);
      const payoutPool = (round.pot || 0) * 0.80;
      const calculated = winners.map((b: any) => ({
        wallet: b.wallet,
        bet: b.amount,
        payout: totalWinning > 0 ? parseFloat(((b.amount / totalWinning) * payoutPool).toFixed(6)) : 0,
        tier: b.tier,
      }));
      setPayouts(calculated);
    } else {
      setPayouts([]);
    }
  }

  const totalPot = selectedRound ? (selectedRound.pot || 0) : 0;
  const rake = parseFloat((totalPot * 0.19).toFixed(4));
  const jackpotCut = parseFloat((totalPot * 0.01).toFixed(4));
  const winnerPool = parseFloat((totalPot * 0.80).toFixed(4));

  return (
    <main className="min-h-screen text-white p-4" style={{ background: "linear-gradient(135deg,#0a0010,#0d0020)" }}>
      <div className="max-w-2xl mx-auto">

        <h1 className="text-2xl font-black text-purple-400 mb-1">🎰 Degen Echo Admin</h1>
        <p className="text-purple-700 text-xs mb-6">Payout calculator — keep this page private</p>

        {loading && <p className="text-purple-400">Loading...</p>}

        {/* Round list */}
        <div className="rounded-2xl border border-purple-900 mb-4 overflow-hidden">
          <div className="p-3 border-b border-purple-900 bg-purple-900/20">
            <p className="text-purple-300 font-bold text-sm">Recent Rounds</p>
          </div>
          {rounds.map((r) => (
            <button
              key={r.id}
              onClick={() => loadRoundBets(r)}
              className={`w-full flex justify-between items-center px-4 py-3 border-b border-purple-900/50 text-left hover:bg-purple-900/20 transition-all ${selectedRound?.id === r.id ? "bg-purple-900/40" : ""}`}
            >
              <div>
                <span className="text-white font-bold text-sm">Round #{r.id}</span>
                <span className="text-purple-500 text-xs ml-2">{r.date} {r.hour}:00</span>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.settled ? "bg-green-900/50 text-green-400" : "bg-yellow-900/50 text-yellow-400"}`}>
                  {r.settled ? "Settled" : "Active"}
                </span>
                {r.winning_tier && (
                  <span className="text-xs text-purple-400 ml-2">{TIERS[r.winning_tier]}</span>
                )}
                <span className="text-green-400 text-xs ml-2 font-bold">{(r.pot || 0).toFixed(3)} SOL</span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected round detail */}
        {selectedRound && (
          <>
            {/* Pot breakdown */}
            <div className="rounded-2xl border border-purple-800 p-4 mb-4" style={{ background: "linear-gradient(135deg,#0d0020,#1a0030)" }}>
              <p className="text-purple-300 font-bold mb-3">Round #{selectedRound.id} Breakdown</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-900/30 rounded-xl p-3 border border-green-800">
                  <p className="text-green-400 text-xs font-bold">WINNER POOL</p>
                  <p className="text-green-300 font-black text-xl">{winnerPool} SOL</p>
                  <p className="text-green-700 text-xs">80% of pot</p>
                </div>
                <div className="bg-purple-900/30 rounded-xl p-3 border border-purple-800">
                  <p className="text-purple-400 text-xs font-bold">YOUR RAKE</p>
                  <p className="text-purple-300 font-black text-xl">{rake} SOL</p>
                  <p className="text-purple-700 text-xs">19% of pot</p>
                </div>
                <div className="bg-yellow-900/30 rounded-xl p-3 border border-yellow-800">
                  <p className="text-yellow-400 text-xs font-bold">JACKPOT CUT</p>
                  <p className="text-yellow-300 font-black text-xl">{jackpotCut} SOL</p>
                  <p className="text-yellow-700 text-xs">1% of pot</p>
                </div>
              </div>
            </div>

            {/* Payouts */}
            {payouts.length > 0 ? (
              <div className="rounded-2xl border border-green-800 p-4 mb-4" style={{ background: "linear-gradient(135deg,#001500,#002000)" }}>
                <p className="text-green-300 font-bold mb-3">💸 SEND THESE PAYOUTS</p>
                <div className="space-y-2">
                  {payouts.map((p, i) => (
                    <div key={i} className="bg-green-900/20 rounded-xl p-3 border border-green-900">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-green-400 font-black text-lg">{p.payout} SOL</span>
                        <span className="text-green-700 text-xs">bet: {p.bet} SOL</span>
                      </div>
                      <p className="text-gray-300 text-xs font-mono break-all">{p.wallet}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-green-900/30 rounded-xl border border-green-800">
                  <p className="text-green-400 text-xs font-bold">TOTAL TO SEND: {payouts.reduce((s, p) => s + p.payout, 0).toFixed(6)} SOL</p>
                  <p className="text-green-700 text-xs mt-1">You keep: {rake} SOL rake + {jackpotCut} SOL jackpot contribution</p>
                </div>
              </div>
            ) : selectedRound.settled ? (
              <div className="rounded-2xl border border-orange-800 p-4 mb-4 text-center">
                <p className="text-orange-400 font-bold">🔄 Rollover Round — no winners, pot carried over</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-yellow-800 p-4 mb-4 text-center">
                <p className="text-yellow-400 font-bold">⏳ Round still active — not settled yet</p>
              </div>
            )}

            {/* All bets */}
            <div className="rounded-2xl border border-purple-900 p-4 mb-4">
              <p className="text-purple-300 font-bold mb-3">All Bets This Round ({bets.length})</p>
              <div className="space-y-2">
                {bets.map((b, i) => (
                  <div key={i} className={`rounded-xl p-3 border text-xs ${b.tier === selectedRound.winning_tier ? "border-green-700 bg-green-900/20" : "border-purple-900 bg-purple-900/10"}`}>
                    <div className="flex justify-between mb-1">
                      <span className="text-purple-300 font-bold">{TIERS[b.tier] || b.tier}</span>
                      <span className="text-green-400 font-bold">{b.amount} SOL</span>
                    </div>
                    <p className="text-gray-500 font-mono break-all">{b.wallet}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <button onClick={loadData} className="w-full py-3 rounded-xl font-bold text-sm border border-purple-800 text-purple-400 hover:bg-purple-900/20">
          🔄 Refresh
        </button>

      </div>
    </main>
  );
}
