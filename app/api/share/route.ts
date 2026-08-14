import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { encodeShareCard, tweetText, type ShareCard } from "@/lib/share"

const clampPct = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)))
const clampInt = (n: unknown, max: number) =>
  Math.max(0, Math.min(max, Math.round(Number(n) || 0)))

/**
 * Mints a signed share token from the numbers the dashboard is already showing.
 * Requires a session, and always takes the identity fields from that session so
 * a caller cannot publish a card under someone else's handle.
 */
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.accessToken || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const user = session.user

  const card: ShareCard = {
    u: user.login,
    n: user.name ?? undefined,
    a: user.avatar_url || undefined,
    s: clampPct(body.balanceScore),
    c: clampInt(body.totalCommits, 1_000_000),
    st: clampInt(body.streakDays, 3650),
    ls: clampInt(body.longestStreak, 3650),
    ph: clampInt(body.peakHour, 23),
    wp: clampPct(body.workdayPct),
    np: clampPct(body.nightPct),
    wk: clampPct(body.weekendCommitPct),
    r: clampInt(body.totalRepos, 100_000),
    l: typeof body.topLanguage === "string" ? body.topLanguage.slice(0, 24) : undefined,
  }

  const token = encodeShareCard(card)
  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
  const shareUrl = `${origin}/s/${token}`
  const imageUrl = `${origin}/api/share/image?t=${token}`

  const intentUrl =
    "https://x.com/intent/post?" +
    new URLSearchParams({ text: tweetText(card), url: shareUrl }).toString()

  return NextResponse.json({ token, shareUrl, imageUrl, intentUrl })
}
