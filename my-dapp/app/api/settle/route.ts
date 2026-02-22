import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  const secret = process.env.SETTLE_SECRET

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Your existing settlement logic here
  return NextResponse.json({ ok: true, settled: true })
}
