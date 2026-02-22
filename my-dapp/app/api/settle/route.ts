import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const TIERS = [
  { label: '🚀 Big Pump',    value: 'bigpump',   check: (p: number) => p > 1.5 },
  { label: '📈 Small Pump',  value: 'smallpump', check: (p: number) => p >= 0.5 && p <= 1.5 },
  { label: '😴 Stagnate',    value: 'stagnate',  check: (p: number) => p > -0.5 && p < 0.5 },
  { label: '📉 Small Dump',  value: 'smalldump', check: (p: number) => p <= -0.5 && p >= -1.5 },
  { label: '💀 Big Dump',    value: 'bigdump',   check: (p: number) => p < -1.5 },
]

async function getSolPrice(): Promise<number> {
  const res = await fetch('https://api.kraken.com/0/public/Ticker?pair=SOLUSD')
  const data = await res.json()
  return parseFloat(data.result.SOLUSD.c[0])
}

async function sendEmail(to: string, subject: string, body: string) {
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!
    },
    body: JSON.stringify({
      sender: { name: 'Degen Echo', email: 'noreply@degenecho.com' },
      to: [{ email: to }],
      subject,
      textContent: body
    })
  })
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  const secret = process.env.SETTLE_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const currentPrice = await getSolPrice()
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const hour = now.getHours()

    // Find unsettled rounds from previous hour
    const prevHour = hour === 0 ? 23 : hour - 1
    const prevDate = hour === 0
      ? new Date(now.getTime() - 86400000).toISOString().slice(0, 10)
      : date

    const { data: rounds } = await supabase
      .from('rounds')
      .select('*')
      .eq('date', prevDate)
      .eq('hour', prevHour)
      .eq('settled', false)

    if (!rounds || rounds.length === 0) {
      return NextResponse.json({ ok: true, message: 'No unsettled rounds found' })
    }

    const results = []

    for (const round of rounds) {
      const startPrice = round.start_price
      if (!startPrice) continue

      const pctChange = ((currentPrice - startPrice) / startPrice) * 100
      const winningTier = TIERS.find(t => t.check(pctChange))

      if (!winningTier) continue

      // Get all bets for this round
      const { data: bets } = await supabase
        .from('bets')
        .select('*')
        .eq('round_id', round.id)

      if (!bets) continue

      const winningBets = bets.filter((b: any) => b.tier === winningTier.value)
      const totalWinningAmount = winningBets.reduce((sum: number, b: any) => sum + b.amount, 0)
      const payoutPool = (round.pot || 0) * 0.80
      const isRollover = winningBets.length === 0

      // Calculate payouts
      const payouts = winningBets.map((b: any) => ({
        wallet: b.wallet,
        amount: parseFloat(((b.amount / totalWinningAmount) * payoutPool).toFixed(6))
      }))

      // Mark round settled
      await supabase.from('rounds').update({
        end_price: currentPrice,
        winning_tier: winningTier.value,
        settled: true,
        is_rollover: isRollover
      }).eq('id', round.id)

      // Update streaks
      for (const bet of bets) {
        const won = bet.tier === winningTier.value
        const { data: existing } = await supabase
          .from('streaks')
          .select('*')
          .eq('wallet', bet.wallet)
          .single()

        const newStreak = won ? (existing?.current_streak || 0) + 1 : 0
        const jackpotHit = newStreak >= 10

        if (existing) {
          await supabase.from('streaks').update({
            current_streak: jackpotHit ? 0 : newStreak,
            total_wins: (existing.total_wins || 0) + (won ? 1 : 0),
            updated_at: new Date().toISOString()
          }).eq('wallet', bet.wallet)
        } else {
          await supabase.from('streaks').insert({
            wallet: bet.wallet,
            current_streak: jackpotHit ? 0 : newStreak,
            total_wins: won ? 1 : 0
          })
        }

        if (jackpotHit) {
          await sendEmail(
            'Dburnett11155@gmail.com',
            '🏆 JACKPOT HIT!',
            `JACKPOT WINNER!\n\nWallet: ${bet.wallet}\nJackpot amount: ${round.jackpot} SOL\n\nSend jackpot immediately!`
          )
        }
      }

      // Create next round
      const newPot = isRollover ? round.pot : 0
      await supabase.from('rounds').insert({
        hour,
        date,
        start_price: currentPrice,
        pot: newPot,
        jackpot: round.jackpot,
        is_rollover: isRollover,
        rollover_amount: isRollover ? round.pot : 0,
        settled: false
      })

      // Send payout email
      const payoutText = payouts.length > 0
        ? payouts.map((p: any) => `${p.wallet}: ${p.amount} SOL`).join('\n')
        : 'No winners this round — pot rolled over'

      await sendEmail(
        'Dburnett11155@gmail.com',
        `Degen Echo Round ${round.id} Settled`,
        `Round settled!\n\nDate: ${prevDate} Hour: ${prevHour}\nWinning tier: ${winningTier.label}\nSOL moved: ${pctChange.toFixed(3)}%\nTotal pot: ${round.pot} SOL\nRollover: ${isRollover}\n\nPAYOUTS:\n${payoutText}`
      )

      results.push({
        roundId: round.id,
        winningTier: winningTier.label,
        pctChange: pctChange.toFixed(3),
        payouts,
        isRollover
      })
    }

    return NextResponse.json({ ok: true, settled: results })

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
