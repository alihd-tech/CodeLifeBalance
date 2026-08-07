import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { analyzeUser } from "@/lib/github"

export async function GET() {
  const session = await getSession()
  if (!session.accessToken || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const data = await analyzeUser(session.accessToken, session.user.login)
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
