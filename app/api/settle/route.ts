import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TIERS = [
  { label: "🚀 Big Pump", value: "bigpump", check: (p: number) => p > 1.5 },
  { label: "📈 Small Pump", value: "smallpump", check: (p: number) => p >= 0.5 && p <= 1.5 },
  { label: "😴 Stagnate", value: "stagnate", check: (p: number) => p > -0.5 && p < 0.5 },
  { label: "📉 Small Dump", value: "smalldump", check: (p: number) => p <= -0.5 && p >= -1.5 },
  { label: "💀 Big Dump", value: "bigdump", check: (p: number) => p < -1.5 },
]

export async function GET() {
  try {
    const priceRes = await fetch("https://api.kraken.com/0/public/Ticker?pair=SOLUSD")
    const priceData = await priceRes.json()
    const currentPrice = parseFloat(priceData.result.SOLUSD.c[0])

    const now = new Date()
    const currentHour = now.getHours()
    const today = now.toISOString().slice(0, 10)

    const { data: unsettled } = await supabase
      .from('rounds')
      .select('*')
      .eq('settled', false)
      .not('start_price', 'is', null)

    if (!unsettled || unsettled.length === 0) {
      return NextResponse.json({ ok: true, message: 'No unsettled rounds' })
    }

    const results = []

    for (const round of unsettled) {
      if (round.hour === currentHour && round.date === today) continue
      if (!round.start_price) continue

      const pctChange = ((currentPrice - round.start_price) / round.start_price) * 100
      const winningTier = TIERS.find(t => t.check(pctChange))
      if (!winningTier) continue

      const { data: bets } = await supabase
        .from('bets')
        .select('*')
        .eq('round_id', round.id)

      if (!bets) continue

      const winningBets = bets.filter((b: any) => b.tier === winningTier.value)
      const totalWinning = winningBets.reduce((sum: number, b: any) => sum + b.amount, 0)
      const payoutPool = (round.pot || 0) * 0.89
      const isRollover = winningBets.length === 0

      const payouts = winningBets.map((b: any) => ({
        wallet: b.wallet,
        amount: totalWinning > 0 ? parseFloat(((b.amount / totalWinning) * payoutPool).toFixed(6)) : 0
      }))

      await supabase.from('rounds').update({
        end_price: currentPrice,
        winning_tier: winningTier.value,
        settled: true,
        is_rollover: isRollover
      }).eq('id', round.id)

      if (payouts.length > 0) {
        const payoutText = payouts.map((p: any) => `${p.wallet}: ${p.amount} SOL`).join('\n')
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'Dburnett11155@gmail.com',
            subject: `Degen Echo Round #${round.id} Payouts`,
            body: `Round #${round.id} settled!\n\nWinning tier: ${winningTier.label}\nSOL moved: ${pctChange.toFixed(3)}%\nTotal pot: ${round.pot} SOL\nRake (10%): ${((round.pot || 0) * 0.10).toFixed(4)} SOL\n\nPAYOUTS:\n${payoutText}\n\nTotal to send: ${payouts.reduce((s: number, p: any) => s + p.amount, 0).toFixed(6)} SOL`
          })
        })
      }

      results.push({ round: round.id, winningTier: winningTier.value, payouts })
    }

    return NextResponse.json({ ok: true, settled: results })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}
