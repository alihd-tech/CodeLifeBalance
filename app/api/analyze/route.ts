import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { analyzeUser, GitHubError } from "@/lib/github"

/**
 * Two ways in:
 *   /api/analyze                  the signed-in user, private activity included
 *   /api/analyze?username=octocat public data only, no authorization needed
 */
export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("username")?.trim()
  const session = await getSession()

  let token: string | null = null
  let username: string

  if (requested) {
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(requested)) {
      return NextResponse.json({ error: "That is not a valid GitHub username." }, { status: 400 })
    }
    username = requested
    // Only reuse the session token when the visitor is asking about themselves.
    if (session.accessToken && session.user?.login.toLowerCase() === requested.toLowerCase()) {
      token = session.accessToken
    }
  } else {
    if (!session.accessToken || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    token = session.accessToken
    username = session.user.login
  }

  try {
    const data = await analyzeUser(token, username)
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof GitHubError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
