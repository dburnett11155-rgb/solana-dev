import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { roundId } = await req.json()
  try {
    const res = await fetch('https://api.huddle01.com/api/v1/create-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.HUDDLE01_API_KEY!,
      },
      body: JSON.stringify({
        title: `Degen Echo Round ${roundId}`,
      }),
    })
    const data = await res.json()
    return NextResponse.json({ roomId: data?.data?.roomId })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
