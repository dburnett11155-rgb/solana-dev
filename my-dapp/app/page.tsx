"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { supabase } from "./lib/supabase";
import SolChart from "./components/SolChart";
import EchoArena from "./components/EchoArena";
import ShareButton from "./components/ShareButton";

const RAKE_WALLET = new PublicKey("9pWyRYfKahQZPTnNMcXhZDDsUV75mHcb2ZpxGqzZsHnK");
const JACKPOT_STREAK = 10;
const ADMIN_EMAIL = "Dburnett11155@gmail.com";

const TIERS = [
  { label: "🚀 Big Pump", value: "bigpump", desc: "> +1.5%", border: "border-green-500", text: "text-green-400", bg: "bg-green-900/30", check: (p: number) => p > 1.5 },
  { label: "📈 Small Pump", value: "smallpump", desc: "+0.5% to +1.5%", border: "border-emerald-500", text: "text-emerald-400", bg: "bg-emerald-900/30", check: (p: number) => p >= 0.5 && p <= 1.5 },
  { label: "😴 Stagnate", value: "stagnate", desc: "-0.5% to +0.5%", border: "border-yellow-500", text: "text-yellow-400", bg: "bg-yellow-900/30", check: (p: number) => p > -0.5 && p < 0.5 },
  { label: "📉 Small Dump", value: "smalldump", desc: "-1.5% to -0.5%", border: "border-orange-500", text: "text-orange-400", bg: "bg-orange-900/30", check: (p: number) => p <= -0.5 && p >= -1.5 },
  { label: "💀 Big Dump", value: "bigdump", desc: "< -1.5%", border: "border-red-500", text: "text-red-400", bg: "bg-red-900/30", check: (p: number) => p < -1.5 },
];

const WALLETS = ["Degen","Ape","Moon","Whale","Chad","Fomo","Yolo","Giga","Wagmi","Ngmi"];
const SUFFIXES = ["7x","3k","9z","4w","8m","2p"];
function randomWallet() {
  return WALLETS[Math.floor(Math.random()*WALLETS.length)] +
    SUFFIXES[Math.floor(Math.random()*SUFFIXES.length)] + "..." +
    Math.random().toString(36).slice(2,5).toUpperCase();
}

function getTodayStr() {
  return new Date().toISOString().slice(0,10);
}
function getCurrentHour() {
  return new Date().getHours();
}

export default function Home() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [price, setPrice] = useState<number|null>(null);
  const [prevPrice, setPrevPrice] = useState<number|null>(null);
  const [priceHistory, setPriceHistory] = useState<{time:number,value:number}[]>([]);
  const [choice, setChoice] = useState<string|null>(null);
  const [amount, setAmount] = useState("0.1");
  const [timeLeft, setTimeLeft] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(3600);
  const [pot, setPot] = useState(0);
  const [jackpot, setJackpot] = useState(0.041);
  const [isRollover, setIsRollover] = useState(false);
  const [rolloverAmount, setRolloverAmount] = useState(0);
  const [betPlaced, setBetPlaced] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [txSig, setTxSig] = useState<string|null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [liveFeed, setLiveFeed] = useState<{wallet:string,choice:string,amount:string}[]>([]);
  const [tierCounts, setTierCounts] = useState({bigpump:0,smallpump:0,stagnate:0,smalldump:0,bigdump:0});
  const [streak, setStreak] = useState(0);
  const [jackpotWon, setJackpotWon] = useState(false);
  const [roundId, setRoundId] = useState<number|null>(null);
  const [roundStartPrice, setRoundStartPrice] = useState<number|null>(null);
  const [lastResult, setLastResult] = useState<{winningTier:string,pctChange:number}|null>(null);
  const [liveChange, setLiveChange] = useState<number|null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Load or create current round from Supabase
  const loadRound = useCallback(async () => {
    const hour = getCurrentHour();
    const date = getTodayStr();
    let { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('hour', hour)
      .eq('date', date)
      .single();
    if (!data) {
    }
    if (data) {
      setRoundId(data.id);
      setPot(data.pot || 0);
      setJackpot(data.jackpot || 0.041);
      setIsRollover(data.is_rollover || false);
      setRolloverAmount(data.rollover_amount || 0);
      if (data.start_price) setRoundStartPrice(data.start_price);
    }
    // Load bets for this round
    if (data?.id) {
      const { data: bets } = await supabase
        .from('bets')
        .select('*')
        .eq('round_id', data.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (bets && bets.length > 0) {
        const counts = {bigpump:0,smallpump:0,stagnate:0,smalldump:0,bigdump:0};
        const feed: {wallet:string,choice:string,amount:string}[] = [];
        bets.forEach((b:any) => {
          if (counts[b.tier as keyof typeof counts] !== undefined) {
            counts[b.tier as keyof typeof counts]++;
          }
          feed.push({ wallet: b.wallet.slice(0,6)+"..."+b.wallet.slice(-4), choice: b.tier, amount: b.amount.toString() });
        });
        setTierCounts(counts);
        setLiveFeed(feed);
      }
    }
    // Load streak for connected wallet
    if (publicKey) {
      const { data: streakData } = await supabase
        .from('streaks')
        .select('*')
        .eq('wallet', publicKey.toString())
        .single();
      if (streakData) setStreak(streakData.current_streak || 0);
    }
  }, [price, publicKey]);

  useEffect(() => { loadRound(); }, []);

  // Settle round at top of hour
  const settleRound = useCallback(async () => {
    if (!roundId || !roundStartPrice || !price) return;
    const pctChange = ((price - roundStartPrice) / roundStartPrice) * 100;
    const winningTier = TIERS.find(t => t.check(pctChange));
    if (!winningTier) return;

    // Get all bets for this round
    const { data: bets } = await supabase
      .from('bets')
      .select('*')
      .eq('round_id', roundId);

    if (!bets) return;

    const winningBets = bets.filter((b:any) => b.tier === winningTier.value);
    const totalWinningAmount = winningBets.reduce((sum:number, b:any) => sum + b.amount, 0);
    const payoutPool = pot * 0.89;

    // Build payout list
    const payouts: {wallet:string, amount:number}[] = winningBets.map((b:any) => ({
      wallet: b.wallet,
      amount: parseFloat(((b.amount / totalWinningAmount) * payoutPool).toFixed(6))
    }));

    // Check rollover
    const isRolloverRound = winningBets.length === 0;

    // Send email with payout instructions
    if (payouts.length > 0) {
      const payoutText = payouts.map(p => `${p.wallet}: ${p.amount} SOL`).join('\n');
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: ADMIN_EMAIL,
          subject: `Degen Echo Round ${roundId} Payouts`,
          body: `Round settled!\n\nWinning tier: ${winningTier.label}\nSOL moved: ${pctChange.toFixed(3)}%\nTotal pot: ${pot} SOL\n\nPAYOUTS:\n${payoutText}\n\nRollover: ${isRolloverRound}`
        })
      });
    }

    // Update round as settled
    await supabase.from('rounds').update({
      end_price: price,
      winning_tier: winningTier.value,
      settled: true,
      is_rollover: isRolloverRound
    }).eq('id', roundId);

    // Update streaks
    for (const bet of bets) {
      const won = bet.tier === winningTier.value;
      const { data: existingStreak } = await supabase
        .from('streaks')
        .select('*')
        .eq('wallet', bet.wallet)
        .single();

      const newStreak = won ? (existingStreak?.current_streak || 0) + 1 : 0;
      const jackpotHit = newStreak >= JACKPOT_STREAK;

      if (existingStreak) {
        await supabase.from('streaks').update({
          current_streak: jackpotHit ? 0 : newStreak,
          total_wins: (existingStreak.total_wins || 0) + (won ? 1 : 0),
          jackpot_claimed: jackpotHit ? true : existingStreak.jackpot_claimed,
          updated_at: new Date().toISOString()
        }).eq('wallet', bet.wallet);
      } else {
        await supabase.from('streaks').insert({
          wallet: bet.wallet,
          current_streak: jackpotHit ? 0 : newStreak,
          total_wins: won ? 1 : 0,
          jackpot_claimed: jackpotHit
        });
      }

      if (jackpotHit && bet.wallet === publicKey?.toString()) {
        setJackpotWon(true);
        // Email jackpot winner info
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: ADMIN_EMAIL,
            subject: '🏆 JACKPOT HIT!',
            body: `JACKPOT WINNER!\n\nWallet: ${bet.wallet}\nJackpot amount: ${jackpot} SOL\n\nSend jackpot immediately!`
          })
        });
      }
    }

    setLastResult({ winningTier: winningTier.label, pctChange });

    // Create new round
    const newHour = getCurrentHour();
    const newPot = isRolloverRound ? pot : 0;
    const newRolloverAmount = isRolloverRound ? (rolloverAmount + pot) : 0;
    const { data: newRound } = await supabase.from('rounds').insert({
      hour: newHour,
      date: getTodayStr(),
      start_price: price,
      pot: newPot,
      jackpot: jackpot,
      is_rollover: isRolloverRound,
      rollover_amount: newRolloverAmount
    }).select().single();

    if (newRound) {
      setRoundId(newRound.id);
      setPot(newPot);
      setTierCounts({bigpump:0,smallpump:0,stagnate:0,smalldump:0,bigdump:0});
      setLiveFeed([]);
      setBetPlaced(false);
      setChoice(null);
      setRoundStartPrice(price);
      setIsRollover(isRolloverRound);
      setRolloverAmount(isRolloverRound ? pot : 0);
    }
  }, [roundId, roundStartPrice, price, pot, jackpot, publicKey]);

  // Check for hour change every 30 seconds
  useEffect(() => {
    const i = setInterval(async () => {
      const hour = getCurrentHour();
      const date = getTodayStr();
      const { data } = await supabase
        .from('rounds')
        .select('id,hour,date,settled')
        .eq('hour', hour)
        .eq('date', date)
        .single();
      if (!data) await settleRound();
    }, 30000);
    return () => clearInterval(i);
  }, [settleRound]);

  // Fetch live price
  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch("https://api.kraken.com/0/public/Ticker?pair=SOLUSD");
        const data = await res.json();
        const p = parseFloat(data.result.SOLUSD.c[0]);
        setPrevPrice(price);
        setPrice(p);
        setPriceHistory(prev => [...prev, {time:Date.now(),value:p}].slice(-60));
        if (roundStartPrice) {
          setLiveChange(((p - roundStartPrice) / roundStartPrice) * 100);
        }
      } catch {}
    }
    fetchPrice();
    const i = setInterval(fetchPrice, 10000);
    return () => clearInterval(i);
  }, [price, roundStartPrice]);

  // Fetch price history for chart
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("https://api.kraken.com/0/public/OHLC?pair=SOLUSD&interval=60");
        const data = await res.json();
        const candles = data.result.SOLUSD || data.result[Object.keys(data.result)[0]];
        setPriceHistory(candles.slice(-24).map((c:any[]) => ({time:c[0]*1000,value:parseFloat(c[4])})));
      } catch {}
    }
    fetchHistory();
  }, []);

  // Countdown
  useEffect(() => {
    function update() {
      const now = new Date();
      const next = new Date(now);
      next.setHours(now.getHours()+1,0,0,0);
      const secs = Math.floor((next.getTime()-now.getTime())/1000);
      setSecondsLeft(secs);
      const m = Math.floor(secs/60);
      const s = secs%60;
      setTimeLeft(`${m}m ${s<10?"0":""}${s}s`);
    }
    update();
    const i = setInterval(update,1000);
    return () => clearInterval(i);
  }, []);

  // Slow fake bets
  useEffect(() => {
    function addFakeBet() {
      const tierKeys = ["bigpump","smallpump","stagnate","smalldump","bigdump"];
      const rc = tierKeys[Math.floor(Math.random()*tierKeys.length)] as keyof typeof tierCounts;
      const amounts = ["0.1","0.1","0.2","0.25","0.5"];
      const ra = amounts[Math.floor(Math.random()*amounts.length)];
      setLiveFeed(prev => [{wallet:randomWallet(),choice:rc,amount:ra},...prev.slice(0,8)]);
      setTierCounts(prev => ({...prev,[rc]:prev[rc]+1}));
      setTimeout(addFakeBet, 45000+Math.random()*30000);
    }
    const t = setTimeout(addFakeBet, 60000);
    return () => clearTimeout(t);
  }, []);

  // Draw chart
  useEffect(() => {
    if (!chartRef.current || priceHistory.length < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = chartRef.current.offsetWidth || 400;
    canvas.height = 140;
    chartRef.current.innerHTML = "";
    chartRef.current.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const values = priceHistory.map(p => p.value);
    const min = Math.min(...values)*0.9995;
    const max = Math.max(...values)*1.0005;
    const w = canvas.width;
    const h = canvas.height;
    // Grid lines
    ctx.strokeStyle = "rgba(139,92,246,0.1)";
    ctx.lineWidth = 1;
    for (let i=0;i<4;i++) {
      const y = (h/4)*i;
      ctx.beginPath();
      ctx.moveTo(0,y);
      ctx.lineTo(w,y);
      ctx.stroke();
    }
    // Price line
    const grad = ctx.createLinearGradient(0,0,0,h);
    grad.addColorStop(0,"rgba(139,92,246,0.4)");
    grad.addColorStop(1,"rgba(139,92,246,0)");
    ctx.beginPath();
    priceHistory.forEach((p,i) => {
      const x = (i/(priceHistory.length-1))*w;
      const y = h-((p.value-min)/(max-min))*h*0.85-h*0.05;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Fill
    const lastX = w;
    const lastY = h-((priceHistory[priceHistory.length-1].value-min)/(max-min))*h*0.85-h*0.05;
    ctx.lineTo(lastX,h);
    ctx.lineTo(0,h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    // Price labels
    ctx.fillStyle = "rgba(139,92,246,0.6)";
    ctx.font = "10px monospace";
    ctx.fillText(`$${max.toFixed(2)}`,4,12);
    ctx.fillText(`$${min.toFixed(2)}`,4,h-4);
  }, [priceHistory]);

  async function handleBet() {
    if (!connected||!choice||!amount||!publicKey||!roundId) return;
    setError(null);
    setSending(true);
    try {
      const a = parseFloat(amount);
      const lamports = Math.floor(a*LAMPORTS_PER_SOL);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: RAKE_WALLET,
          lamports,
        })
      );
      const {blockhash} = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      const sig = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(sig,"confirmed");
      setTxSig(sig);

      // Record bet in Supabase
      const jackpotCut = a*0.01;
      const potCut = a*0.89;
      const newPot = parseFloat((pot+potCut).toFixed(4));
      const newJackpot = parseFloat((jackpot+jackpotCut).toFixed(4));

      await supabase.from('bets').insert({
        round_id: roundId,
        wallet: publicKey.toString(),
        tier: choice,
        amount: a,
        tx_sig: sig
      });

      await supabase.from('rounds').update({
        pot: newPot,
        jackpot: newJackpot
      }).eq('id', roundId);

      setPot(newPot);
      setJackpot(newJackpot);
      setLiveFeed(prev => [{wallet:publicKey.toString().slice(0,6)+"..."+publicKey.toString().slice(-4),choice,amount},...prev.slice(0,8)]);
      setTierCounts(prev => ({...prev,[choice]:prev[choice as keyof typeof tierCounts]+1}));
      setBetPlaced(true);
      setShowConfirm(true);
      setTimeout(()=>setShowConfirm(false),6000);
    } catch(e:any) {
      setError(e.message||"Transaction failed. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const total = Object.values(tierCounts).reduce((a,b)=>a+b,0);
  const timerColor = secondsLeft<300?"text-red-400 animate-pulse":secondsLeft<600?"text-yellow-400":"text-green-400";
  const priceUp = prevPrice&&price&&price>prevPrice;
  const priceDown = prevPrice&&price&&price<prevPrice;
  const priceColor = priceUp?"text-green-400":priceDown?"text-red-400":"text-purple-300";
  const totalPot = pot + rolloverAmount;
  const liveTier = liveChange!==null ? TIERS.find(t=>t.check(liveChange!)) : null;

  return (
    <main className="min-h-screen text-white p-3" style={{background:"linear-gradient(135deg,#0a0010 0%,#0d0020 50%,#050010 100%)"}}>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
              🎰 DEGEN ECHO
            </h1>
            <p className="text-xs text-purple-400">Predict SOL. Stack gains.</p>
          </div>

        </div>

        {/* Last result */}
        {lastResult && (
          <div className="rounded-xl p-3 mb-3 border border-purple-800 text-center" style={{background:"linear-gradient(135deg,#0d0020,#0a0018)"}}>
            <p className="text-purple-400 text-xs font-bold">LAST ROUND</p>
            <p className="text-white text-xs">
              {lastResult.winningTier} won · SOL moved {lastResult.pctChange>0?"+":""}{lastResult.pctChange.toFixed(2)}%
            </p>
          </div>
        )}

        {/* How it works */}
        <div className="rounded-2xl p-4 mb-3 border border-purple-900" style={{background:"linear-gradient(135deg,#0d0020,#0a0018)"}}>
          <p className="text-purple-300 font-bold text-sm mb-2">⚡ How it works</p>
          <p className="text-gray-400 text-xs leading-relaxed mb-3">
            Every hour a new round opens. Predict which direction SOL moves — pick your tier, place your SOL, and if you nail it you split the entire pot proportional to your bet size. The rarer your call, the bigger your cut. Miss the window and wait for the next round. One hour. One shot.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-purple-900/30 rounded-lg p-2">
              <p className="text-purple-300 text-xs font-bold">🎯 Pick a tier</p>
              <p className="text-gray-500 text-xs">5 ranges</p>
            </div>
            <div className="bg-purple-900/30 rounded-lg p-2">
              <p className="text-purple-300 text-xs font-bold">💰 Bet SOL</p>
              <p className="text-gray-500 text-xs">Any amount</p>
            </div>
            <div className="bg-purple-900/30 rounded-lg p-2">
              <p className="text-purple-300 text-xs font-bold">🏆 Split pot</p>
              <p className="text-gray-500 text-xs">By bet size</p>
            </div>
          </div>
        </div>

        {/* Jackpot */}
        <div className="rounded-2xl p-4 mb-3 border border-yellow-800 text-center" style={{background:"linear-gradient(135deg,#1a1000,#201500)"}}>
          <p className="text-yellow-300 font-black text-base">⚡ JACKPOT</p>
          <p className="text-yellow-400 font-black text-4xl my-1">{jackpot.toFixed(3)} SOL</p>
          <p className="text-yellow-600 text-xs mb-1">Grows with every bet. Never resets. Never been won.</p>
          <p className="text-yellow-500 text-xs font-bold">🔥 Hit a 10 win streak — claim it all</p>
          {streak > 0 && (
            <div className="mt-3 bg-yellow-900/40 rounded-xl p-2">
              <p className="text-yellow-300 font-black text-sm">Your streak: {streak} / {JACKPOT_STREAK} 🔥</p>
              <div className="w-full bg-yellow-900/30 rounded-full h-2 mt-1">
                <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{width:`${(streak/JACKPOT_STREAK)*100}%`}} />
              </div>
            </div>
          )}
        </div>

        {/* Rollover */}
        {isRollover && (
          <div className="bg-gradient-to-r from-yellow-900/60 to-orange-900/60 border border-yellow-500 rounded-2xl p-4 mb-3 text-center">
            <p className="text-yellow-300 font-black text-xl">🔥 ROLLOVER ROUND!</p>
            <p className="text-white font-black text-2xl">{rolloverAmount.toFixed(2)} SOL ROLLED OVER</p>
            <p className="text-yellow-500 text-xs mt-1">Last round had no winner — pot carried over!</p>
          </div>
        )}

        {/* Jackpot won */}
        {jackpotWon && (
          <div className="bg-yellow-900/60 border-2 border-yellow-400 rounded-2xl p-6 mb-3 text-center">
            <p className="text-yellow-300 font-black text-3xl">🏆 JACKPOT!</p>
            <p className="text-white font-black text-xl">10 WIN STREAK!</p>
            <p className="text-yellow-400 text-sm mt-2">Payout incoming to your wallet!</p>
          </div>
        )}

        {/* Price + Timer + Chart */}
        <div className="rounded-2xl p-4 mb-3 border border-purple-800" style={{background:"linear-gradient(135deg,#1a0030,#0d0025)"}}>
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-purple-400 text-xs font-bold">SOL/USD LIVE</p>
              <p className={`text-4xl font-black ${priceColor}`}>
                {price?`$${price.toFixed(2)}`:"..."}
                <span className="text-lg ml-1">{priceUp?"▲":priceDown?"▼":""}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-purple-400 text-xs font-bold">ROUND ENDS</p>
              <p className={`text-2xl font-black ${timerColor}`}>{timeLeft}</p>
              {secondsLeft<300&&<p className="text-red-400 text-xs animate-pulse">⚠️ CLOSING SOON</p>}
            </div>
          </div>
          {liveChange!==null&&liveTier&&(
            <div className={`rounded-lg px-3 py-1 mb-2 text-center text-xs font-bold ${liveTier.bg} border ${liveTier.border}`}>
              <span className={liveTier.text}>
                Currently: {liveTier.label} ({liveChange>0?"+":""}{liveChange.toFixed(3)}% from open)
              </span>
            </div>
          )}
          <SolChart />
        </div>

        {/* Pot */}
        <div className="rounded-2xl p-4 border border-green-800 text-center mb-3" style={{background:"linear-gradient(135deg,#001500,#002000)"}}>
          <p className="text-green-400 text-xs font-bold">💰 THIS ROUND POT</p>
          <p className="text-green-300 font-black text-4xl">{totalPot.toFixed(3)} SOL</p>
          <p className="text-green-700 text-xs">Split proportionally among winners · resets each hour</p>
        </div>

        {/* Confirm */}
        {showConfirm&&txSig&&(
          <div className="bg-green-900/40 border border-green-500 rounded-2xl p-4 mb-3 text-center">
            <p className="text-green-400 font-black text-xl">✅ BET CONFIRMED!</p>
            <p className="text-green-300 text-sm mb-2">{amount} SOL on {TIERS.find(t=>t.value===choice)?.label}</p>
            <a href={`https://solscan.io/tx/${txSig}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-xs underline">
              View on Solscan ↗
            </a>
          </div>
        )}
        {betPlaced && txSig && (
          <ShareButton
            betAmount={amount}
            tierLabel={TIERS.find(t => t.value === choice)?.label ?? ""}
            tierValue={choice ?? ""}
            potSize={totalPot}
            dAppUrl="https://solana-dev-seven.vercel.app"
          />
        )}

        {error&&(
          <div className="bg-red-900/40 border border-red-500 rounded-2xl p-3 mb-3 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Betting */}
        <div className="rounded-2xl p-4 border border-purple-800 mb-3" style={{background:"linear-gradient(135deg,#0d0020,#120025)"}}>
          <p className="text-center text-purple-300 font-bold mb-3">Where is SOL going this hour?</p>
          <div className="space-y-2 mb-4">
            {TIERS.map((tier) => {
              const count = tierCounts[tier.value as keyof typeof tierCounts];
              const pct = total>0?Math.round(count/total*100):0;
              const isLive = liveTier?.value===tier.value;
              return (
                <button
                  key={tier.value}
                  onClick={()=>setChoice(tier.value)}
                  className={`w-full rounded-xl font-bold text-sm transition-all border ${tier.border} ${
                    choice===tier.value?`${tier.bg} shadow-lg`:"bg-[#1a0030] hover:bg-[#220040]"
                  }`}
                >
                  <div className="flex justify-between items-center px-3 py-3">
                    <span className="text-left">{tier.label}{isLive?" ← now":""}</span>
                    <span className={`text-xs ${tier.text} hidden sm:block`}>{tier.desc}</span>
                    <span className="text-gray-500 text-xs">{total>0?`${count}·${pct}%`:"first"}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-5 gap-1 mb-3">
            {["0.1","0.5","1.0","2.0","5.0"].map(a=>(
              <button
                key={a}
                onClick={()=>setAmount(a)}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  amount===a?"bg-purple-600 text-white":"bg-[#1a0030] border border-purple-900 text-purple-300 hover:bg-purple-900"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <input
            type="number"
            value={amount}
            onChange={(e)=>setAmount(e.target.value)}
            className="w-full bg-[#1a0030] border border-purple-800 rounded-xl px-4 py-3 text-white outline-none mb-3 text-center font-bold text-lg"
            min="0.001"
            step="0.001"
          />

          {connected?(
            betPlaced?(
              <button
                onClick={()=>{setBetPlaced(false);setChoice(null);setTxSig(null);}}
                className="w-full py-4 rounded-xl font-black text-lg bg-purple-900 border border-purple-600 text-purple-300"
              >
                🔄 Place Another Bet
              </button>
            ):(
              <button
                onClick={handleBet}
                disabled={!choice||sending}
                className={`w-full py-4 rounded-xl font-black text-lg transition-all ${
                  choice&&!sending
                    ?"bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 shadow-lg text-white"
                    :"bg-gray-800 text-gray-600 cursor-not-allowed"
                }`}
              >
                {sending?"⏳ Confirming...":choice?`🎲 BET ${amount} SOL ON ${TIERS.find(t=>t.value===choice)?.label}`:"⬆️ Pick a tier first"}
              </button>
            )
          ):(
            <div className="text-center text-purple-400 py-3 text-sm border border-purple-900 rounded-xl">
              Connect wallet to start betting
            </div>
          )}
        </div>

        <EchoArena roundId={roundId} walletAddress={publicKey?.toString()} />

        {/* Live feed */}
        {liveFeed.length>0&&(
          <div className="rounded-2xl p-4 border border-purple-900 mb-3" style={{background:"linear-gradient(135deg,#0d0020,#0a0018)"}}>
            <p className="text-purple-400 text-sm font-bold mb-3">⚡ LIVE BETS</p>
            <div className="space-y-1">
              {liveFeed.map((bet,i)=>{
                const tier=TIERS.find(t=>t.value===bet.choice);
                return (
                  <div key={i} className={`flex justify-between text-xs rounded-lg px-3 py-2 ${i===0?"bg-purple-900/40 border border-purple-700":"bg-[#1a0030]"}`}>
                    <span className="text-gray-400 truncate max-w-[120px]">{bet.wallet}</span>
                    <span className={`font-bold ${tier?.text}`}>{tier?.label}</span>
                    <span className="text-green-400 font-bold">{bet.amount} SOL</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl p-4 mb-4 border-2 border-yellow-400 text-center relative overflow-hidden" style={{background:"linear-gradient(135deg,#1a1000,#2a1800,#1a1000)"}}><div className="absolute inset-0 opacity-10" style={{backgroundImage:"repeating-linear-gradient(45deg,#eab308 0,#eab308 1px,transparent 0,transparent 50%)",backgroundSize:"10px 10px"}}></div><p className="text-yellow-300 font-black text-lg relative z-10">🪂 $DEGEN AIRDROP INCOMING</p><p className="text-yellow-100 font-bold text-sm mt-1 relative z-10">Stake now to qualify! Snapshot in 30-60 days.</p><p className="text-yellow-200 text-xs mt-1 relative z-10">First 500 wallets with 0.1 SOL staked get tokens. More info soon.</p><div className="mt-3 inline-block bg-yellow-400 text-black font-black text-xs px-4 py-1.5 rounded-full relative z-10 animate-pulse">STAKE NOW TO QUALIFY</div></div>
        {/* Disclaimer */}
        <p className="text-center text-purple-900 text-xs mt-2 mb-6 px-4 leading-relaxed">
          Platform fee applies. Degen Echo is a skill-based prediction game. Participation involves financial risk and is intended for entertainment purposes only. By participating, you confirm you are of legal age in your jurisdiction, that participation is not prohibited by applicable law, and that you accept full responsibility for any losses incurred. Degen Echo makes no guarantees of profit. Past results do not predict future outcomes. Payouts are processed within 1 hour of round close. The jackpot accumulates continuously and is awarded to the first player to achieve a verified 10-round win streak. All transactions are final. Degen Echo reserves the right to modify game parameters at any time.
        </p>

      </div>
    </main>
  );
}
