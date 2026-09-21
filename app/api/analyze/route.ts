import { NextRequest, NextResponse } from "next/server"
import { getOptionalSession, getSession } from "@/lib/session"
import { analyzeUser, GitHubError } from "@/lib/github"

/**
 * Two ways in:
 *   /api/analyze                  the signed-in user, private activity included
 *   /api/analyze?username=octocat public data only, no authorization needed
 */
export async function GET(request: NextRequest) {
  try {
    const requested = request.nextUrl.searchParams.get("username")?.trim()

    let token: string | null = null
    let username: string

    if (requested) {
      if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(requested)) {
        return NextResponse.json(
          { error: "That is not a valid GitHub username." },
          { status: 400 }
        )
      }

      username = requested

      // Public username analysis must remain available even when the hosted
      // OAuth/session layer is intentionally not configured.
      const session = await getOptionalSession()

      // Only reuse a hosted session token when the visitor is analyzing
      // themselves. Otherwise public GitHub data is used without a token.
      if (
        session?.accessToken &&
        session.user?.login.toLowerCase() === requested.toLowerCase()
      ) {
        token = session.accessToken
      }
    } else {
      // The private dashboard is an authenticated hosted feature, so keep its
      // session requirement strict.
      const session = await getSession()

      if (!session.accessToken || !session.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }

      token = session.accessToken
      username = session.user.login
    }

    const data = await analyzeUser(token, username)
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof GitHubError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }

    const message =
      err instanceof Error && err.message
        ? err.message
        : "Public GitHub analysis failed unexpectedly."

    console.error("GitHub analysis request failed", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
