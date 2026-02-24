export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { price, hourOpen, timeLeft, tierCounts, pot } = await req.json()

  const prompt = `You are Vibe Oracle, an AI co-pilot for Degen Echo — a Solana price prediction game.

Current data:
- SOL current price: $${price}
- Hour open price: $${hourOpen}
- Change from open: ${hourOpen ? (((price - hourOpen) / hourOpen) * 100).toFixed(3) : 'unknown'}%
- Time left in round: ${timeLeft}
- Current pot: ${pot} SOL
- Bets by tier: Big Pump: ${tierCounts.bigpump}, Small Pump: ${tierCounts.smallpump}, Stagnate: ${tierCounts.stagnate}, Small Dump: ${tierCounts.smalldump}, Big Dump: ${tierCounts.bigdump}

Based on this data give your analysis. Respond ONLY with a valid JSON object, no markdown, no explanation outside the JSON:
{
  "summary": "2-3 sentence vibe read on where SOL is heading this hour",
  "probabilities": {
    "bigpump": 0-100,
    "smallpump": 0-100,
    "stagnate": 0-100,
    "smalldump": 0-100,
    "bigdump": 0-100
  },
  "topPick": "bigpump|smallpump|stagnate|smalldump|bigdump",
  "confidence": "low|medium|high",
  "warning": "optional short warning or null"
}`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.7
      })
    })

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json({ ok: true, oracle: parsed })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
