"use client";

import { useState, useRef, useCallback } from "react";

interface ShareButtonProps {
  betAmount: string;
  tierLabel: string;
  tierValue: string;
  potSize: number;
  dAppUrl?: string;
}

const TIER_EMOJI: Record<string, string> = {
  bigpump: "🚀",
  smallpump: "📈",
  stagnate: "😴",
  smalldump: "📉",
  bigdump: "💀",
};

const TIER_COLOR: Record<string, string> = {
  bigpump: "#22c55e",
  smallpump: "#10b981",
  stagnate: "#eab308",
  smalldump: "#f97316",
  bigdump: "#ef4444",
};

export default function ShareButton({
  betAmount,
  tierLabel,
  tierValue,
  potSize,
  dAppUrl = "https://solana-dev-seven.vercel.app",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [generatingCard, setGeneratingCard] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const tweetText = `🎰 Just dropped ${betAmount} SOL on ${tierLabel} at Degen Echo!\n\n💰 Current pot: ${potSize.toFixed(3)} SOL\n🔥 First 500 stakers get $DEGEN airdrop\n\nCan you predict where SOL goes next hour?\n👉 ${dAppUrl}\n\n#DegenEcho #Solana #SOL #DeFi`;

  const triggerToast = useCallback((msg: string) => {
    setCopied(true);
    setShowToast(true);
    setTimeout(() => {
      setCopied(false);
      setShowToast(false);
    }, 3000);
  }, []);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(tweetText);
      triggerToast("Copied!");
      setShowMenu(false);
    } catch {
      const el = document.createElement("textarea");
      el.value = tweetText;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      triggerToast("Copied!");
    }
  }, [tweetText, triggerToast]);

  const handleTweetNow = useCallback(() => {
    const encoded = encodeURIComponent(tweetText);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, "_blank");
    setShowMenu(false);
  }, [tweetText]);

  const handleDownloadCard = useCallback(async () => {
    setGeneratingCard(true);
    setShowMenu(false);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const cardEl = document.createElement("div");
      cardEl.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:600px;height:315px;background:linear-gradient(135deg,#0a0010 0%,#1a0030 50%,#050010 100%);border:1px solid #7c3aed;border-radius:20px;padding:32px;font-family:'Courier New',monospace;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;`;
      const tierColor = TIER_COLOR[tierValue] || "#a855f7";
      const tierEmoji = TIER_EMOJI[tierValue] || "🎲";
      cardEl.innerHTML = `
        <div style="position:relative;z-index:1;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-size:13px;color:#7c3aed;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px;">🎰 DEGEN ECHO</div>
              <div style="font-size:11px;color:#4c1d95;">Predict SOL. Stack gains.</div>
            </div>
            <div style="background:rgba(139,92,246,0.2);border:1px solid #7c3aed;border-radius:8px;padding:6px 12px;font-size:11px;color:#a855f7;">MAINNET LIVE</div>
          </div>
        </div>
        <div style="position:relative;z-index:1;text-align:center;">
          <div style="font-size:15px;color:#9ca3af;margin-bottom:8px;">I just called it.</div>
          <div style="font-size:52px;margin-bottom:4px;">${tierEmoji}</div>
          <div style="font-size:28px;font-weight:900;color:${tierColor};margin-bottom:4px;">${tierLabel}</div>
          <div style="font-size:14px;color:#c4b5fd;">${betAmount} SOL wagered · ${potSize.toFixed(3)} SOL pot</div>
        </div>
        <div style="position:relative;z-index:1;display:flex;justify-content:space-between;align-items:flex-end;">
          <div>
            <div style="font-size:11px;color:#6d28d9;font-weight:700;margin-bottom:2px;">🎁 FIRST 500 STAKERS</div>
            <div style="font-size:12px;color:#a855f7;font-weight:700;">Get $DEGEN airdrop</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:#4c1d95;margin-bottom:2px;">#DegenEcho #Solana</div>
            <div style="font-size:12px;color:#7c3aed;">${dAppUrl.replace("https://", "")}</div>
          </div>
        </div>
      `;
      document.body.appendChild(cardEl);
      const canvas = await html2canvas(cardEl, { width: 600, height: 315, scale: 2, backgroundColor: null, logging: false });
      document.body.removeChild(cardEl);
      const link = document.createElement("a");
      link.download = `degen-echo-win-${tierValue}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      triggerToast("Card downloaded!");
    } catch (err) {
      await handleCopyText();
    } finally {
      setGeneratingCard(false);
    }
  }, [betAmount, tierLabel, tierValue, potSize, dAppUrl, triggerToast, handleCopyText]);

  return (
    <div className="relative">
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${showToast ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        <div className="px-5 py-3 rounded-2xl font-bold text-sm text-white shadow-2xl border border-purple-500 flex items-center gap-2 whitespace-nowrap" style={{ background: "linear-gradient(135deg, #1a0030, #0d001f)" }}>
          <span className="text-green-400">✓</span>
          Copied to clipboard – share on X / Telegram!
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 border border-pink-700 hover:border-pink-500"
          style={{ background: "linear-gradient(135deg, #2d0040, #1a0030)", color: "#f0abfc" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.26 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
          </svg>
          Share Win
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 24 24" className={`transition-transform ${showMenu ? "rotate-180" : ""}`}>
            <path d="M12 16l-6-6h12z" />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-purple-800 overflow-hidden shadow-2xl z-40" style={{ background: "linear-gradient(135deg, #0d0020, #1a0030)" }}>
            <div className="m-3 rounded-xl p-3 border border-purple-900" style={{ background: "rgba(0,0,0,0.4)" }}>
              <p className="text-purple-400 text-xs font-bold mb-1 uppercase tracking-widest">Preview</p>
              <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">{tweetText}</p>
            </div>
            <div className="flex flex-col gap-1 p-2 pt-0">
              <button onClick={handleTweetNow} className="w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 text-white" style={{ background: "linear-gradient(135deg, #14012a, #200040)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="white" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.26 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                </svg>
                Post to X now
              </button>
              <button onClick={handleCopyText} className="w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 text-purple-300 border border-purple-800 hover:border-purple-600" style={{ background: "rgba(139,92,246,0.1)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                </svg>
                Copy text (X / Telegram)
              </button>
              <button onClick={handleDownloadCard} disabled={generatingCard} className="w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 text-pink-300 border border-pink-900 hover:border-pink-700 disabled:opacity-50" style={{ background: "rgba(236,72,153,0.07)" }}>
                {generatingCard ? "Generating..." : "Download share card (.png)"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
