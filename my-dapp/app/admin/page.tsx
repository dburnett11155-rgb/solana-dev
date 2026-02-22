"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TIERS: Record<string, string> = {
  bigpump: "🚀 Big Pump",
  smallpump: "📈 Small Pump",
  stagnate: "😴 Stagnate",
  smalldump: "📉 Small Dump",
  bigdump: "💀 Big Dump",
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [rounds, setRounds] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [bets, setBets] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === "degen_admin_2026") {
      setAuthed(true);
    } else {
      alert("Wrong password");
    }
  }

  useEffect(() => {
    if (!authed) return;
    async function loadRounds() {
      const { data } = await supabase
        .from("rounds")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(48);
      setRounds(data || []);
    }
    loadRounds();
  }, [authed]);

  async function loadRoundDetail(round: any) {
    setLoading(true);
    setSelected(round);
    const { data: allBets } = await supabase
      .from("bets")
      .select("*")
      .eq("round_id", round.id);
    setBets(allBets || []);

    if (round.settled && round.winning_tier && allBets) {
      const winningBets = allBets.filter((b: any) => b.tier === round.winning_tier);
      const totalWinning = winningBets.reduce((sum: number, b: any) => sum + b.amount, 0);
      const payoutPool = (round.pot || 0) * 0.80;
      const computed = winningBets.map((b: any) => ({
        wallet: b.wallet,
        bet: b.amount,
        payout: totalWinning > 0
          ? parseFloat(((b.amount / totalWinning) * payoutPool).toFixed(6))
          : 0,
        tx: b.tx_sig,
      }));
      setPayouts(computed);
    } else {
      setPayouts([]);
    }
    setLoading(false);
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#0a0010" }}>
        <div className="bg-purple-900/30 border border-purple-700 rounded-2xl p-8 w-80 text-center">
          <h1 className="text-white font-black text-2xl mb-2">🔐 Admin</h1>
          <p className="text-purple-400 text-sm mb-4">Degen Echo Settlement Panel</p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="w-full bg-black border border-purple-800 rounded-xl px-4 py-3 text-white outline-none mb-3 text-center"
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-xl font-black bg-purple-600 hover:bg-purple-500 text-white"
          >
            Enter
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white p-4" style={{ background: "#0a0010" }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-purple-400 mb-1">🎰 Degen Echo Admin</h1>
        <p className="text-purple-600 text-sm mb-6">Settlement & Payout Panel</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Round list */}
          <div>
            <h2 className="text-purple-300 font-bold mb-3">Rounds (newest first)</h2>
            <div className="space-y-2">
              {rounds.map(r => (
                <button
                  key={r.id}
                  onClick={() => loadRoundDetail(r)}
                  className={`w-full text-left rounded-xl px-4 py-3 border transition-all ${
                    selected?.id === r.id
                      ? "border-purple-400 bg-purple-900/50"
                      : "border-purple-900 bg-purple-900/20 hover:bg-purple-900/40"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm font-bold">
                      {r.date} {String(r.hour).padStart(2,"0")}:00
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      r.settled ? "bg-green-900 text-green-400" : "bg-yellow-900 text-yellow-400"
                    }`}>
                      {r.settled ? "SETTLED" : "OPEN"}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-purple-400 text-xs">Pot: {(r.pot||0).toFixed(3)} SOL</span>
                    {r.winning_tier && (
                      <span className="text-green-400 text-xs">{TIERS[r.winning_tier]}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Round detail */}
          <div>
            {selected ? (
              <div>
                <h2 className="text-purple-300 font-bold mb-3">
                  Round Detail — {selected.date} {String(selected.hour).padStart(2,"0")}:00
                </h2>

                <div className="bg-purple-900/20 border border-purple-800 rounded-xl p-4 mb-4 space-y-1 text-sm">
                  <p><span className="text-purple-400">Status:</span> <span className={selected.settled?"text-green-400":"text-yellow-400"}>{selected.settled?"Settled":"Open"}</span></p>
                  <p><span className="text-purple-400">Pot:</span> <span className="text-white">{(selected.pot||0).toFixed(4)} SOL</span></p>
                  <p><span className="text-purple-400">Start price:</span> <span className="text-white">${(selected.start_price||0).toFixed(2)}</span></p>
                  {selected.end_price && <p><span className="text-purple-400">End price:</span> <span className="text-white">${selected.end_price.toFixed(2)}</span></p>}
                  {selected.winning_tier && <p><span className="text-purple-400">Winner:</span> <span className="text-green-400">{TIERS[selected.winning_tier]}</span></p>}
                  {selected.is_rollover && <p className="text-yellow-400 font-bold">🔥 ROLLOVER ROUND</p>}
                </div>

                {/* Payouts */}
                {payouts.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-green-400 font-bold mb-2">💸 SEND THESE PAYOUTS</h3>
                    <div className="space-y-2">
                      {payouts.map((p, i) => (
                        <div key={i} className="bg-green-900/20 border border-green-800 rounded-xl p-3">
                          <p className="text-white text-xs font-mono break-all">{p.wallet}</p>
                          <div className="flex justify-between mt-1">
                            <span className="text-purple-400 text-xs">Bet: {p.bet} SOL</span>
                            <span className="text-green-400 font-black text-sm">→ {p.payout} SOL</span>
                          </div>
                          {p.tx && (
                            <a
                              href={`https://solscan.io/tx/${p.tx}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-500 text-xs underline"
                            >
                              View tx ↗
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 bg-purple-900/30 border border-purple-700 rounded-xl p-3 text-center">
                      <p className="text-purple-400 text-xs">Total to send</p>
                      <p className="text-white font-black text-xl">
                        {payouts.reduce((sum, p) => sum + p.payout, 0).toFixed(4)} SOL
                      </p>
                    </div>
                  </div>
                )}

                {selected.settled && payouts.length === 0 && (
                  <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4 text-center">
                    <p className="text-yellow-400 font-bold">🔥 No winners — pot rolled over</p>
                  </div>
                )}

                {/* All bets */}
                {bets.length > 0 && (
                  <div>
                    <h3 className="text-purple-300 font-bold mb-2">All Bets ({bets.length})</h3>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {bets.map((b, i) => (
                        <div key={i} className={`flex justify-between text-xs rounded-lg px-3 py-2 ${
                          b.tier === selected.winning_tier
                            ? "bg-green-900/30 border border-green-800"
                            : "bg-purple-900/20"
                        }`}>
                          <span className="text-gray-400 font-mono">{b.wallet.slice(0,8)}...{b.wallet.slice(-4)}</span>
                          <span className="text-purple-300">{TIERS[b.tier]}</span>
                          <span className="text-white font-bold">{b.amount} SOL</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {loading && <p className="text-purple-400 text-center mt-4">Loading...</p>}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-purple-600">
                ← Select a round to see details
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
