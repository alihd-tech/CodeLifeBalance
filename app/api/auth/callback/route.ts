import { NextRequest, NextResponse } from "next/server"
import { getSession, GitHubUser } from "@/lib/session"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url))
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/?error=config", request.url))
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  })

  const tokenData = await tokenRes.json() as { access_token?: string; error?: string }
  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL("/?error=token_exchange", request.url))
  }

  // Fetch user profile
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
    },
  })
  const user = await userRes.json() as GitHubUser

  // Save to session
  const session = await getSession()
  session.accessToken = tokenData.access_token
  session.user = user
  await session.save()

  return NextResponse.redirect(new URL("/dashboard", request.url))
}
