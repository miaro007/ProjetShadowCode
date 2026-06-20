import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY!,
          response: token,
        }),
      }
    )

    const data = await response.json()

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    )
  }
}