"use client";

export default function TransparencyPage() {
  const RAKE_WALLET = "9pWyRYfKahQZPTnNMcXhZDDsUV75mHcb2ZpxGqzZsHnK";

  return (
    <main
      className="min-h-screen text-white p-4"
      style={{ background: "linear-gradient(135deg,#0a0010 0%,#0d0020 50%,#050010 100%)" }}
    >
      <div className="max-w-lg mx-auto pt-4">

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent mb-1">
            🔍 Transparency
          </h1>
          <p className="text-gray-400 text-sm">How Degen Echo handles your SOL</p>
        </div>

        <div className="rounded-2xl p-5 border border-purple-800 mb-4" style={{ background: "linear-gradient(135deg,#0d0020,#120025)" }}>
          <p className="text-purple-400 text-xs font-bold uppercase mb-1">Rake Wallet Address</p>
          <p className="text-white font-bold text-sm break-all mb-3">{RAKE_WALLET}</p>
          <a
            href={`https://solscan.io/account/${RAKE_WALLET}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-purple-800 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            View on Solscan ↗
          </a>
        </div>

        <div className="rounded-2xl p-5 border border-purple-900 mb-4" style={{ background: "linear-gradient(135deg,#0d0020,#0a0018)" }}>
          <p className="text-purple-300 font-bold mb-3">💰 How funds are split</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-purple-900 pb-2">
              <span className="text-gray-400 text-sm">Winners pot</span>
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

        <div className="rounded-2xl p-5 border border-purple-900 mb-4" style={{ background: "linear-gradient(135deg,#0d0020,#0a0018)" }}>
          <p className="text-purple-300 font-bold mb-2">⏱ Payout timing</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Payouts are processed manually within 1 hour of each round closing. Winners receive SOL directly to their connected wallet. All transactions are verifiable on-chain.
          </p>
        </div>

        <div className="rounded-2xl p-5 border border-yellow-900 mb-4" style={{ background: "linear-gradient(135deg,#1a1000,#201500)" }}>
          <p className="text-yellow-300 font-bold mb-2">🔥 Rollover rounds</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            If no bets are placed on the winning tier, the entire pot rolls over to the next round. The rake is still taken but winners get a bigger pot the following hour.
          </p>
        </div>

        <div className="rounded-2xl p-5 border border-yellow-800 mb-4" style={{ background: "linear-gradient(135deg,#1a1000,#201500)" }}>
          <p className="text-yellow-300 font-bold mb-2">⚡ Jackpot</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            1% of every bet feeds the jackpot. It never resets and has never been won. The first player to hit a verified 10-round win streak claims the entire jackpot.
          </p>
        </div>

        <div className="rounded-2xl p-5 border border-purple-800 mb-6" style={{ background: "linear-gradient(135deg,#0d0020,#120025)" }}>
          <p className="text-purple-300 font-bold mb-2">📋 Transparency Log</p>
          <p className="text-gray-400 text-sm leading-relaxed mb-3">
            Every round result, winning tier, pot size, and payout is logged publicly.
          </p>
          <div className="bg-purple-900/30 rounded-xl p-3 text-center">
            <p className="text-purple-500 text-xs">Log link coming soon</p>
          </div>
        </div>

      </div>
    </main>
  );
}
