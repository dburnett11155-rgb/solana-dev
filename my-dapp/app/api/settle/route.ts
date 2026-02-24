export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const TIERS = [
  { label: '🚀 Big Pump',   value: 'bigpump',   check: (p: number) => p > 1.5 },
  { label: '📈 Small Pump', value: 'smallpump', check: (p: number) => p >= 0.5 && p <= 1.5 },
  { label: '😴 Stagnate',   value: 'stagnate',  check: (p: number) => p > -0.5 && p < 0.5 },
  { label: '📉 Small Dump', value: 'smalldump', check: (p: number) => p <= -0.5 && p >= -1.5 },
  { label: '💀 Big Dump',   value: 'bigdump',   check: (p: number) => p < -1.5 },
]

function getMultiplier(minutesIntoRound: number): number {
  if (minutesIntoRound < 15) return 1.8
  if (minutesIntoRound < 30) return 1.6
  if (minutesIntoRound < 45) return 1.4
  if (minutesIntoRound < 55) return 1.2
  return 1.0
}

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
    const currentHour = now.getHours()
    const currentDate = now.toISOString().slice(0, 10)

    const { data: allRounds } = await supabase
      .from('rounds')
      .select('*')
      .eq('settled', false)
      .order('created_at', { ascending: true })

    if (!allRounds || allRounds.length === 0) {
      return NextResponse.json({ ok: true, message: 'No unsettled rounds found' })
    }

    const rounds = allRounds.filter(r => {
      if (r.date === currentDate && r.hour === currentHour) return false
      return true
    })

    if (rounds.length === 0) {
      return NextResponse.json({ ok: true, message: 'Only current round is open — nothing to settle' })
    }

    const results = []

    for (const round of rounds) {
      if (!round.start_price || round.start_price === 0) {
        await supabase.from('rounds').update({
          settled: true,
          end_price: currentPrice,
          is_rollover: true
        }).eq('id', round.id)
        results.push({ roundId: round.id, skipped: true, reason: 'no start price' })
        continue
      }

      const pctChange = ((currentPrice - round.start_price) / round.start_price) * 100
      const winningTier = TIERS.find(t => t.check(pctChange))
      if (!winningTier) continue

      const { data: bets } = await supabase
        .from('bets').select('*').eq('round_id', round.id)

      const allBets = bets || []
      const winningBets = allBets.filter((b: any) => b.tier === winningTier.value)
      const payoutPool = (round.pot || 0) * 0.89
      const isRollover = winningBets.length === 0

      // Round start time reconstructed from date + hour
      const roundStartTime = new Date(`${round.date}T${String(round.hour).padStart(2,'0')}:00:00`)

      // Calculate effective weighted amount for each winning bet
      const weightedBets = winningBets.map((b: any) => {
        const betTime = new Date(b.created_at)
        const minutesIntoRound = Math.max(0, (betTime.getTime() - roundStartTime.getTime()) / 60000)
        const multiplier = getMultiplier(minutesIntoRound)
        const effectiveAmount = b.amount * multiplier
        return { ...b, effectiveAmount, multiplier, minutesIntoRound: minutesIntoRound.toFixed(1) }
      })

      const totalEffective = weightedBets.reduce((sum: number, b: any) => sum + b.effectiveAmount, 0)

      const payouts = weightedBets.map((b: any) => ({
        wallet: b.wallet,
        amount: parseFloat(((b.effectiveAmount / totalEffective) * payoutPool).toFixed(6)),
        multiplier: b.multiplier,
        minutesIntoRound: b.minutesIntoRound
      }))

      await supabase.from('rounds').update({
        end_price: currentPrice,
        winning_tier: winningTier.value,
        settled: true,
        is_rollover: isRollover
      }).eq('id', round.id)

      for (const bet of allBets) {
        const won = bet.tier === winningTier.value
        const { data: existing } = await supabase
          .from('streaks').select('*').eq('wallet', bet.wallet).single()
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
          await sendEmail('Dburnett11155@gmail.com', '🏆 JACKPOT HIT!',
            `JACKPOT WINNER!\nWallet: ${bet.wallet}\nAmount: ${round.jackpot} SOL`)
        }
      }

      const payoutText = payouts.length > 0
        ? payouts.map((p: any) => `${p.wallet}: ${p.amount} SOL (${p.multiplier}x multiplier, bet at ${p.minutesIntoRound}min)`).join('\n')
        : 'No winners — pot rolled over'

      if (allBets.length > 0) {
        await sendEmail('Dburnett11155@gmail.com',
          `Degen Echo Round ${round.id} Settled`,
          `Round ${round.id}\nDate: ${round.date} Hour: ${round.hour}\nWinner: ${winningTier.label}\nSOL moved: ${pctChange.toFixed(3)}%\nPot: ${round.pot} SOL\n\nPAYOUTS (time-weighted):\n${payoutText}`
        )
      }

      results.push({ roundId: round.id, winningTier: winningTier.label, pctChange: pctChange.toFixed(3), payouts, isRollover })
    }

    const { data: existingRound } = await supabase
      .from('rounds')
      .select('id')
      .eq('date', currentDate)
      .eq('hour', currentHour)
      .single()

    if (!existingRound) {
      await supabase.from('rounds').insert({
        hour: currentHour,
        date: currentDate,
        start_price: currentPrice,
        pot: 0,
        jackpot: 0.041,
        is_rollover: false,
        rollover_amount: 0,
        settled: false
      })
    }

    return NextResponse.json({ ok: true, settled: results })

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
