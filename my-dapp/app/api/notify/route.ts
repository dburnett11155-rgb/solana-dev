import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { to, subject, body } = await req.json()
  
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to,
        subject,
        text: body
      })
    })
    return NextResponse.json({ ok: true })
  } catch(e) {
    return NextResponse.json({ ok: false })
  }
}
