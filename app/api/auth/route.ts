import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "GitHub client ID not configured" }, { status: 500 })
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "read:user repo",
    allow_signup: "true",
  })

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  )
}
