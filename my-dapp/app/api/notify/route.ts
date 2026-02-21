import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { to, subject, body } = await req.json()
  
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY || ''
      },
      body: JSON.stringify({
        sender: { name: 'Degen Echo', email: 'Dburnett11155@gmail.com' },
        to: [{ email: to }],
        subject,
        textContent: body
      })
    })
    return NextResponse.json({ ok: true })
  } catch(e) {
    return NextResponse.json({ ok: false })
  }
}
