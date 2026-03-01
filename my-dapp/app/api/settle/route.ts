export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor'
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet'
import { IDL, PROGRAM_ID } from '../../lib/degen-echo-idl'
import { getRoundPDA, getRoundVaultPDA } from '../../lib/program'
import { web3 } from '@coral-xyz/anchor'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const TIERS = [
  { label: '🚀 Big Pump',   value: 'bigpump',   check: (p: number) => p > 1.5 },
  { label: '📈 Small Pump', value: 'smallpump', check: (p: number) => p >= 0.5 && p <= 1.5 },
  { label: '😴 Stagnate',   value: 'stagnate',  check: (p: number) => p > -0.2 && p < 0.2 },
  { label: '📉 Small Dump', value: 'smalldump', check: (p: number) => p <= -0.5 && p >= -1.5 },
  { label: '💀 Big Dump',   value: 'bigdump',   check: (p: number) => p < -1.5 },
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
    const currentHour = now.getUTCHours()
    const currentDate = now.toISOString().slice(0, 10)

    // Set up Anchor
    const keypairData = JSON.parse(process.env.AUTHORITY_KEYPAIR || '[]')
    const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData))
    const connection = new Connection(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
      'confirmed'
    )
    const wallet = new NodeWallet(keypair)
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
    const program = new Program(IDL as any, provider)

    const { data: staleRounds } = await supabase
      .from('rounds')
      .select('*')
      .eq('settled', false)

    const results = []

    for (const round of (staleRounds || [])) {
      if (round.date === currentDate && round.hour === currentHour) continue
      if (!round.start_price || round.start_price === 0) {
        await supabase.from('rounds').update({ settled: true }).eq('id', round.id)
        continue
      }

      const pctChange = ((currentPrice - round.start_price) / round.start_price) * 100
      const winningTier = TIERS.find(t => t.check(pctChange))
      const isRollover = !winningTier

      // Call smart contract settle
      try {
        const roundPDA = getRoundPDA(round.hour, round.date)
        const endPriceLamports = new BN(Math.floor(currentPrice * 1e6))
        await program.methods
          .settleRound(endPriceLamports)
          .accounts({
            round: roundPDA,
            authority: keypair.publicKey
          })
          .rpc()
      } catch (e: any) {
        console.log(`On-chain settle error: ${e.message}`)
      }

      await supabase.from('rounds').update({
        end_price: currentPrice,
        winning_tier: winningTier?.value || null,
        settled: true,
        is_rollover: isRollover
      }).eq('id', round.id)

      const { data: bets } = await supabase.from('bets').select('*').eq('round_id', round.id)
      const allBets = bets || []
      const winningBets = allBets.filter((b: any) => b.tier === winningTier?.value)
      const payoutPool = (round.pot || 0) * 0.89
      const totalWinning = winningBets.reduce((s: number, b: any) => s + b.amount, 0)
      const payouts = winningBets.map((b: any) => ({
        wallet: b.wallet,
        amount: parseFloat(((b.amount / totalWinning) * payoutPool).toFixed(6))
      }))

      if (allBets.length > 0) {
        const payoutText = payouts.length > 0
          ? payouts.map((p: any) => `${p.wallet}: ${p.amount} SOL`).join('\n')
          : 'No winners — rollover'
        await sendEmail(
          'Dburnett11155@gmail.com',
          `Degen Echo Round ${round.id} — ${winningTier?.label || 'ROLLOVER'}`,
          `Round ${round.id}\nWinner: ${winningTier?.label || 'ROLLOVER'}\nSOL moved: ${pctChange.toFixed(3)}%\nPot: ${round.pot} SOL\n\nPAYOUTS:\n${payoutText}`
        )
      }

      results.push({ roundId: round.id, winningTier: winningTier?.label, pctChange: pctChange.toFixed(3), isRollover })
    }

    const { data: existingRound } = await supabase
      .from('rounds')
      .select('id')
      .eq('date', currentDate)
      .eq('hour', currentHour)
      .single()

    if (!existingRound) {
      // Calculate rollover from previous rounds
      const totalRollover = (staleRounds || []).reduce((sum: number, r: any) => {
        if (r.is_rollover) return sum + (r.pot || 0)
        return sum
      }, 0)
      
      await supabase.from('rounds').insert({
        hour: currentHour,
        date: currentDate,
        start_price: currentPrice,
        pot: totalRollover,
        jackpot: 0,
        is_rollover: totalRollover > 0,
        rollover_amount: totalRollover,
        settled: false
      })
    }

    return NextResponse.json({ ok: true, settled: results })

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
