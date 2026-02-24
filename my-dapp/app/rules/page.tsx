"use client";

export default function RulesPage() {
  return (
    <main
      className="min-h-screen text-white p-4"
      style={{ background: "linear-gradient(135deg,#0a0010 0%,#0d0020 50%,#050010 100%)" }}
    >
      <div className="max-w-lg mx-auto pt-4">

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent mb-1">
            📜 Rules
          </h1>
          <p className="text-gray-400 text-sm">Everything you need to know to play</p>
        </div>

        {/* How to play */}
        <div className="rounded-2xl p-5 border border-purple-800 mb-4" style={{ background: "linear-gradient(135deg,#0d0020,#120025)" }}>
          <p className="text-purple-300 font-bold mb-3">🎮 How to Play</p>
          <div className="space-y-3 text-gray-400 text-sm leading-relaxed">
            <p>1. Connect your Phantom wallet.</p>
            <p>2. Each hour a new round opens. Pick which tier you think SOL will land in by the end of the hour.</p>
            <p>3. Place your SOL bet. You can bet any amount at any time during the 60-minute round.</p>
            <p>4. Betting closes at the <span className="text-purple-300 font-bold">55 minute mark</span>. No bets are accepted in the final 5 minutes of a round.</p>
            <p>5. At the top of the hour the round settles automatically. If your tier wins, you split the pot proportional to your bet size.</p>
          </div>
        </div>

        {/* Tiers */}
        <div className="rounded-2xl p-5 border border-purple-900 mb-4" style={{ background: "linear-gradient(135deg,#0d0020,#0a0018)" }}>
          <p className="text-purple-300 font-bold mb-3">📊 The 5 Tiers</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-green-900/20 rounded-lg px-3 py-2">
              <span className="text-green-400 font-bold text-sm">🚀 Big Pump</span>
              <span className="text-gray-400 text-xs">SOL moves more than +1.5%</span>
            </div>
            <div className="flex justify-between items-center bg-emerald-900/20 rounded-lg px-3 py-2">
              <span className="text-emerald-400 font-bold text-sm">📈 Small Pump</span>
              <span className="text-gray-400 text-xs">+0.5% to +1.5%</span>
            </div>
            <div className="flex justify-between items-center bg-yellow-900/20 rounded-lg px-3 py-2">
              <span className="text-yellow-400 font-bold text-sm">😴 Stagnate</span>
              <span className="text-gray-400 text-xs">-0.2% to +0.2%</span>
            </div>
            <div className="flex justify-between items-center bg-orange-900/20 rounded-lg px-3 py-2">
              <span className="text-orange-400 font-bold text-sm">📉 Small Dump</span>
              <span className="text-gray-400 text-xs">-1.5% to -0.5%</span>
            </div>
            <div className="flex justify-between items-center bg-red-900/20 rounded-lg px-3 py-2">
              <span className="text-red-400 font-bold text-sm">💀 Big Dump</span>
              <span className="text-gray-400 text-xs">SOL moves more than -1.5%</span>
            </div>
          </div>
        </div>

        {/* Time weighted */}
        <div className="rounded-2xl p-5 border border-purple-900 mb-4" style={{ background: "linear-gradient(135deg,#0d0020,#0a0018)" }}>
          <p className="text-purple-300 font-bold mb-3">⏱ Time-Weighted Payouts</p>
          <p className="text-gray-400 text-sm leading-relaxed mb-3">
            Bet early and win more. Your payout is multiplied based on when you placed your bet:
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-purple-900/20 rounded-lg px-3 py-2">
              <span className="text-white text-sm font-bold">0 – 15 min</span>
              <span className="text-green-400 font-black">1.8×</span>
            </div>
            <div className="flex justify-between items-center bg-purple-900/20 rounded-lg px-3 py-2">
              <span className="text-white text-sm font-bold">15 – 30 min</span>
              <span className="text-green-400 font-black">1.6×</span>
            </div>
            <div className="flex justify-between items-center bg-purple-900/20 rounded-lg px-3 py-2">
              <span className="text-white text-sm font-bold">30 – 45 min</span>
              <span className="text-yellow-400 font-black">1.4×</span>
            </div>
            <div className="flex justify-between items-center bg-purple-900/20 rounded-lg px-3 py-2">
              <span className="text-white text-sm font-bold">45 – 55 min</span>
              <span className="text-orange-400 font-black">1.2×</span>
            </div>
            <div className="flex justify-between items-center bg-purple-900/20 rounded-lg px-3 py-2">
              <span className="text-white text-sm font-bold">55 – 60 min</span>
              <span className="text-red-400 font-black">1.0×</span>
            </div>
          </div>
        </div>

        {/* Jackpot */}
        <div className="rounded-2xl p-5 border border-yellow-800 mb-4" style={{ background: "linear-gradient(135deg,#1a1000,#201500)" }}>
          <p className="text-yellow-300 font-bold mb-3">⚡ Jackpot Rules</p>
          <div className="space-y-2 text-gray-400 text-sm leading-relaxed">
            <p>• The jackpot starts at <span className="text-yellow-400 font-bold">2 SOL</span> and grows with every bet.</p>
            <p>• Hit a <span className="text-yellow-400 font-bold">8-round win streak</span> to claim the entire jackpot.</p>
            <p>• Only bets placed in the <span className="text-yellow-400 font-bold">first 30 minutes</span> of a round count toward your streak.</p>
            <p>• A minimum bet of <span className="text-yellow-400 font-bold">0.1 SOL</span> is required for a win to count toward your streak.</p>
            <p>• Late bets (30–60 min) can still win the pot but will never trigger the jackpot.</p>
            <p>• The jackpot never resets until it is won.</p>
            <p>• Win streak resets to 0 if you lose or skip a round.</p>
          </div>
        </div>

        {/* Rollover */}
        <div className="rounded-2xl p-5 border border-yellow-900 mb-4" style={{ background: "linear-gradient(135deg,#1a1000,#201500)" }}>
          <p className="text-yellow-300 font-bold mb-3">🔥 Rollover Rounds</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            If no bets are placed on the winning tier, the full pot rolls over to the next round. This means the next round starts with a bigger pot already in it. Rollovers can stack across multiple rounds.
          </p>
        </div>

        {/* Pot split */}
        <div className="rounded-2xl p-5 border border-purple-900 mb-4" style={{ background: "linear-gradient(135deg,#0d0020,#0a0018)" }}>
          <p className="text-purple-300 font-bold mb-3">💰 Pot Split</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b border-purple-900 pb-2">
              <span className="text-gray-400 text-sm">Winners</span>
              <span className="text-green-400 font-black text-lg">89%</span>
            </div>
            <div className="flex justify-between items-center border-b border-purple-900 pb-2">
              <span className="text-gray-400 text-sm">Platform rake</span>
              <span className="text-red-400 font-black text-lg">10%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Jackpot pool</span>
              <span className="text-yellow-400 font-black text-lg">1%</span>
            </div>
          </div>
        </div>

        {/* Payouts */}
        <div className="rounded-2xl p-5 border border-purple-900 mb-6" style={{ background: "linear-gradient(135deg,#0d0020,#0a0018)" }}>
          <p className="text-purple-300 font-bold mb-2">📤 Payouts</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Payouts are processed manually within 1 hour of each round closing. SOL is sent directly to your connected wallet. All transactions are verifiable on-chain via Solscan.
          </p>
        </div>

      </div>
    </main>
  );
}
