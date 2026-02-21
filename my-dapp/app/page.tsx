"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const TIERS = [
  { label: "🚀 Big Pump", value: "bigpump", desc: "> +1.5%", border: "border-green-500", text: "text-green-400", bg: "bg-green-900/30" },
  { label: "📈 Small Pump", value: "smallpump", desc: "+0.5% to +1.5%", border: "border-emerald-500", text: "text-emerald-400", bg: "bg-emerald-900/30" },
  { label: "😴 Stagnate", value: "stagnate", desc: "-0.5% to +0.5%", border: "border-yellow-500", text: "text-yellow-400", bg: "bg-yellow-900/30" },
  { label: "📉 Small Dump", value: "smalldump", desc: "-1.5% to -0.5%", border: "border-orange-500", text: "text-orange-400", bg: "bg-orange-900/30" },
  { label: "💀 Big Dump", value: "bigdump", desc: "< -1.5%", border: "border-red-500", text: "text-red-400", bg: "bg-red-900/30" },
];

const WALLETS = ["Degen", "Ape", "Moon", "Whale", "Chad", "Fomo", "Yolo", "Giga", "Wagmi", "Ngmi"];
const SUFFIXES = ["7x", "3k", "9z", "4w", "8m", "2p"];
function randomWallet() {
  return WALLETS[Math.floor(Math.random() * WALLETS.length)] +
    SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)] + "..." +
    Math.random().toString(36).slice(2, 5).toUpperCase();
}

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [price, setPrice] = useState<number | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<{time: number, value: number}[]>([]);
  const [choice, setChoice] = useState<string | null>(null);
  const [amount, setAmount] = useState("0.1");
  const [timeLeft, setTimeLeft] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(3600);
  const [pot, setPot] = useState(1.8);
  const [jackpot, setJackpot] = useState(0.04);
  const [isRollover, setIsRollover] = useState(false);
  const [rolloverAmount, setRolloverAmount] = useState(0);
  const [betPlaced, setBetPlaced] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [liveFeed, setLiveFeed] = useState<{wallet: string, choice: string, amount: string}[]>([]);
  const [tierCounts, setTierCounts] = useState({ bigpump: 4, smallpump: 6, stagnate: 8, smalldump: 5, bigdump: 3 });
  const chartRef = useRef<HTMLDivElement>(null);

  // Fetch live price
  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch("https://api.kraken.com/0/public/Ticker?pair=SOLUSD");
        const data = await res.json();
        const p = parseFloat(data.result.SOLUSD.c[0]);
        setPrevPrice(price);
        setPrice(p);
        setPriceHistory(prev => {
          const updated = [...prev, { time: Date.now(), value: p }];
          return updated.slice(-60);
        });
      } catch { }
    }
    fetchPrice();
    const i = setInterval(fetchPrice, 10000);
    return () => clearInterval(i);
  }, [price]);

  // Fetch price history for chart
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("https://api.kraken.com/0/public/OHLC?pair=SOLUSD&interval=60");
        const data = await res.json();
        const candles = data.result.SOLUSD || data.result[Object.keys(data.result)[0]];
        const history = candles.slice(-24).map((c: any[]) => ({
          time: c[0] * 1000,
          value: parseFloat(c[4]),
        }));
        setPriceHistory(history);
      } catch { }
    }
    fetchHistory();
  }, []);

  // Countdown
  useEffect(() => {
    function update() {
      const now = new Date();
      const next = new Date(now);
      next.setHours(now.getHours() + 1, 0, 0, 0);
      const diff = next.getTime() - now.getTime();
      const secs = Math.floor(diff / 1000);
      setSecondsLeft(secs);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setTimeLeft(`${m}m ${s < 10 ? "0" : ""}${s}s`);
    }
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  // Slow realistic fake bets - one every 30-45 seconds
  useEffect(() => {
    function addFakeBet() {
      const tierKeys = ["bigpump", "smallpump", "stagnate", "smalldump", "bigdump"];
      const rc = tierKeys[Math.floor(Math.random() * tierKeys.length)] as keyof typeof tierCounts;
      const amounts = ["0.1", "0.2", "0.5", "0.5", "1.0", "0.1", "0.25"];
      const ra = amounts[Math.floor(Math.random() * amounts.length)];
      setLiveFeed(prev => [{ wallet: randomWallet(), choice: rc, amount: ra }, ...prev.slice(0, 8)]);
      setPot(prev => parseFloat((prev + parseFloat(ra) * 0.79).toFixed(3)));
      setJackpot(prev => parseFloat((prev + parseFloat(ra) * 0.01).toFixed(4)));
      setTierCounts(prev => ({ ...prev, [rc]: prev[rc] + 1 }));
      const next = 30000 + Math.random() * 15000;
      setTimeout(addFakeBet, next);
    }
    const t = setTimeout(addFakeBet, 35000);
    return () => clearTimeout(t);
  }, []);

  // Draw chart
  useEffect(() => {
    if (!chartRef.current || priceHistory.length < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = chartRef.current.offsetWidth;
    canvas.height = 120;
    chartRef.current.innerHTML = "";
    chartRef.current.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const values = priceHistory.map(p => p.value);
    const min = Math.min(...values) * 0.999;
    const max = Math.max(...values) * 1.001;
    const w = canvas.width;
    const h = canvas.height;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(139, 92, 246, 0.3)");
    grad.addColorStop(1, "rgba(139, 92, 246, 0)");
    ctx.beginPath();
    priceHistory.forEach((p, i) => {
      const x = (i / (priceHistory.length - 1)) * w;
      const y = h - ((p.value - min) / (max - min)) * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }, [priceHistory]);

  function handleBet() {
    if (!connected || !choice || !amount) return;
    const a = parseFloat(amount);
    setPot(prev => parseFloat((prev + a * 0.79).toFixed(3)));
    setJackpot(prev => parseFloat((prev + a * 0.01).toFixed(4)));
    const wallet = publicKey?.toString() || "";
    setLiveFeed(prev => [{ wallet: wallet.slice(0, 6) + "..." + wallet.slice(-4), choice, amount }, ...prev.slice(0, 8)]);
    setTierCounts(prev => ({ ...prev, [choice]: prev[choice as keyof typeof tierCounts] + 1 }));
    setBetPlaced(true);
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 4000);
  }

  const total = Object.values(tierCounts).reduce((a, b) => a + b, 0);
  const timerColor = secondsLeft < 300 ? "text-red-400 animate-pulse" : secondsLeft < 600 ? "text-yellow-400" : "text-green-400";
  const priceUp = prevPrice && price && price > prevPrice;
  const priceDown = prevPrice && price && price < prevPrice;
  const priceColor = priceUp ? "text-green-400" : priceDown ? "text-red-400" : "text-purple-300";
  const totalPot = isRollover ? pot + rolloverAmount : pot;

  return (
    <main className="min-h-screen text-white p-4" style={{background: "linear-gradient(135deg, #0a0010 0%, #0d0020 50%, #050010 100%)"}}>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
              🎰 DEGEN ECHO
            </h1>
            <p className="text-xs text-purple-400">Predict SOL. Stack gains.</p>
          </div>
          <WalletMultiButton />
        </div>

        {/* Rollover banner — only shows when real rollover */}
        {isRollover && (
          <div className="bg-gradient-to-r from-yellow-900/60 to-orange-900/60 border border-yellow-500 rounded-2xl p-4 mb-4 text-center">
            <p className="text-yellow-300 font-black text-xl">🔥 ROLLOVER ROUND!</p>
            <p className="text-white font-black text-2xl">{rolloverAmount.toFixed(2)} SOL ROLLED OVER</p>
            <p className="text-yellow-500 text-xs mt-1">Rake reduced to 15% this round</p>
          </div>
        )}

        {/* Price + Timer */}
        <div className="rounded-2xl p-4 mb-4 border border-purple-800" style={{background: "linear-gradient(135deg, #1a0030 0%, #0d0025 100%)"}}>
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-purple-400 text-xs font-bold">SOL/USD LIVE</p>
              <p className={`text-5xl font-black ${priceColor}`}>
                {price ? `$${price.toFixed(2)}` : "..."}
                <span className="text-xl ml-1">{priceUp ? "▲" : priceDown ? "▼" : ""}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-purple-400 text-xs font-bold">ROUND ENDS</p>
              <p className={`text-3xl font-black ${timerColor}`}>{timeLeft}</p>
              {secondsLeft < 300 && <p className="text-red-400 text-xs animate-pulse">⚠️ CLOSING SOON</p>}
            </div>
          </div>
          {/* Price Chart */}
          <div ref={chartRef} className="w-full rounded-xl overflow-hidden" style={{height: "120px", background: "#0d0020"}} />
        </div>

        {/* Pot + Jackpot */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl p-4 border border-green-800 text-center" style={{background: "linear-gradient(135deg, #001500 0%, #002000 100%)"}}>
            <p className="text-green-400 text-xs font-bold">💰 POT</p>
            <p className="text-green-300 font-black text-3xl">{totalPot.toFixed(2)}</p>
            <p className="text-green-700 text-xs">SOL</p>
          </div>
          <div className="rounded-2xl p-4 border border-yellow-800 text-center" style={{background: "linear-gradient(135deg, #1a1000 0%, #201500 100%)"}}>
            <p className="text-yellow-400 text-xs font-bold">⚡ JACKPOT</p>
            <p className="text-yellow-300 font-black text-3xl">{jackpot.toFixed(3)}</p>
            <p className="text-yellow-700 text-xs">SOL</p>
          </div>
        </div>

        {/* Bet confirmed */}
        {showConfirm && (
          <div className="bg-green-900/40 border border-green-500 rounded-2xl p-4 mb-4 text-center">
            <p className="text-green-400 font-black text-xl">✅ BET CONFIRMED!</p>
            <p className="text-green-300 text-sm">{amount} SOL on {TIERS.find(t => t.value === choice)?.label}</p>
          </div>
        )}

        {/* Betting Card */}
        <div className="rounded-2xl p-4 border border-purple-800 mb-4" style={{background: "linear-gradient(135deg, #0d0020 0%, #120025 100%)"}}>
          <p className="text-center text-purple-300 font-bold mb-3">Where is SOL going this hour?</p>

          <div className="space-y-2 mb-4">
            {TIERS.map((tier) => {
              const count = tierCounts[tier.value as keyof typeof tierCounts];
              const pct = Math.round(count / total * 100);
              return (
                <button
                  key={tier.value}
                  onClick={() => setChoice(tier.value)}
                  className={`w-full rounded-xl font-bold text-sm transition-all border ${tier.border} ${
                    choice === tier.value ? `${tier.bg} scale-102 shadow-lg` : "bg-[#1a0030] hover:bg-[#220040]"
                  }`}
                >
                  <div className="flex justify-between items-center px-4 py-3">
                    <span>{tier.label}</span>
                    <span className={`text-xs ${tier.text}`}>{tier.desc}</span>
                    <span className="text-gray-500 text-xs">{count} · {pct}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick amounts */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {["0.1", "0.5", "1.0", "2.0", "5.0"].map(a => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  amount === a ? "bg-purple-600 text-white" : "bg-[#1a0030] border border-purple-900 text-purple-300 hover:bg-purple-900"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#1a0030] border border-purple-800 rounded-xl px-4 py-3 text-white outline-none mb-3 text-center font-bold text-lg"
            min="0.001"
            step="0.001"
          />

          {connected ? (
            betPlaced ? (
              <button
                onClick={() => { setBetPlaced(false); setChoice(null); }}
                className="w-full py-4 rounded-xl font-black text-lg bg-purple-900 border border-purple-600 text-purple-300"
              >
                🔄 Place Another Bet
              </button>
            ) : (
              <button
                onClick={handleBet}
                disabled={!choice}
                className={`w-full py-4 rounded-xl font-black text-lg transition-all ${
                  choice
                    ? "bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-900/50 text-white"
                    : "bg-gray-800 text-gray-600 cursor-not-allowed"
                }`}
              >
                {choice ? `🎲 BET ${amount} SOL ON ${TIERS.find(t => t.value === choice)?.label}` : "⬆️ Pick a tier first"}
              </button>
            )
          ) : (
            <div className="text-center text-purple-400 py-3 text-sm border border-purple-900 rounded-xl">
              Connect wallet to start betting
            </div>
          )}
        </div>

        {/* Live Feed */}
        {liveFeed.length > 0 && (
          <div className="rounded-2xl p-4 border border-purple-900 mb-4" style={{background: "linear-gradient(135deg, #0d0020 0%, #0a0018 100%)"}}>
            <p className="text-purple-400 text-sm font-bold mb-3">⚡ LIVE BETS</p>
            <div className="space-y-1">
              {liveFeed.map((bet, i) => {
                const tier = TIERS.find(t => t.value === bet.choice);
                return (
                  <div key={i} className={`flex justify-between text-xs rounded-lg px-3 py-2 ${i === 0 ? "bg-purple-900/40 border border-purple-700" : "bg-[#1a0030]"}`}>
                    <span className="text-gray-400">{bet.wallet}</span>
                    <span className={`font-bold ${tier?.text}`}>{tier?.label}</span>
                    <span className="text-green-400 font-bold">{bet.amount} SOL</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-center text-purple-900 text-xs mt-2">
          Outcomes determined by Kraken price feed · {isRollover ? "15%" : "20%"} platform fee
        </p>

      </div>
    </main>
  );
}
