export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { price, hourOpen, timeLeft, tierCounts, pot } = await req.json()

  const pctChange = hourOpen ? (((price - hourOpen) / hourOpen) * 100).toFixed(3) : 'unknown'

  const prompt = `You are Vibe Oracle, an AI co-pilot for Degen Echo, a Solana price prediction game. Be concise.

Current data:
- SOL price: $${price}
- Hour open: $${hourOpen}
- Change from open: ${pctChange}%
- Time left: ${timeLeft}
- Pot: ${pot} SOL
- Bets: BigPump:${tierCounts.bigpump} SmallPump:${tierCounts.smallpump} Stagnate:${tierCounts.stagnate} SmallDump:${tierCounts.smalldump} BigDump:${tierCounts.bigdump}

Respond with ONLY this JSON, no other text:
{"summary":"2 sentence analysis","probabilities":{"bigpump":20,"smallpump":25,"stagnate":30,"smalldump":15,"bigdump":10},"topPick":"stagnate","confidence":"medium","warning":null}`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.5
      })
    })

    const data = await res.json()
    
    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json({ ok: false, error: 'No response from Groq: ' + JSON.stringify(data) }, { status: 500 })
    }

    const text = data.choices[0].message.content
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json({ ok: true, oracle: parsed })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
