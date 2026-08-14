import { createHmac, timingSafeEqual } from "crypto"

/**
 * Compact, signed payload behind a public share link.
 * Keys are short because the whole thing ends up in a URL.
 */
export interface ShareCard {
  u: string // github login
  n?: string // display name
  a?: string // avatar url
  s: number // balance score
  c: number // total commits
  st: number // current streak (days)
  ls: number // longest streak (days)
  ph: number // peak hour (0-23)
  wp: number // workday commit pct
  np: number // night commit pct
  wk: number // weekend commit pct
  r: number // repos analysed
  l?: string // top language
}

const SECRET =
  process.env.SESSION_SECRET || "complex-password-at-least-32-characters-long!!"

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function b64urlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4))
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64")
}

function sign(payload: string): string {
  return b64urlEncode(createHmac("sha256", SECRET).update(payload).digest()).slice(0, 22)
}

/** Encode a card into a signed, URL-safe token. */
export function encodeShareCard(card: ShareCard): string {
  const payload = b64urlEncode(Buffer.from(JSON.stringify(card), "utf8"))
  return `${payload}.${sign(payload)}`
}

/** Decode a token, returning null if it is malformed or the signature does not match. */
export function decodeShareCard(token: string): ShareCard | null {
  const dot = token.lastIndexOf(".")
  if (dot < 1) return null

  const payload = token.slice(0, dot)
  const provided = token.slice(dot + 1)
  const expected = sign(payload)

  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const card = JSON.parse(b64urlDecode(payload).toString("utf8")) as ShareCard
    return typeof card?.u === "string" && typeof card?.s === "number" ? card : null
  } catch {
    return null
  }
}

export function formatHour(h: number): string {
  if (h === 0) return "12am"
  if (h < 12) return `${h}am`
  if (h === 12) return "12pm"
  return `${h - 12}pm`
}

/** Short label for a balance score, reused by the card and the tweet text. */
export function scoreLabel(score: number): string {
  if (score >= 85) return "Well balanced"
  if (score >= 70) return "Mostly balanced"
  if (score >= 50) return "Slightly tilted"
  if (score >= 30) return "Out of balance"
  return "Always shipping"
}

/** The chronotype implied by the commit distribution. */
export function chronotype(card: Pick<ShareCard, "ph" | "np" | "wp">): string {
  if (card.np >= 30) return "Night Owl"
  if (card.ph >= 5 && card.ph < 9) return "Early Bird"
  if (card.wp >= 60) return "Nine to Fiver"
  if (card.ph >= 18) return "Evening Coder"
  return "Daylight Committer"
}

/** The text prefilled into the X composer. */
export function tweetText(card: ShareCard): string {
  return [
    `My Code Life Balance score is ${card.s}/100: ${scoreLabel(card.s)}.`,
    "",
    `${chronotype(card)} - peak coding hour ${formatHour(card.ph)}`,
    `${card.c.toLocaleString()} commits across ${card.r} repos`,
    `${card.wk}% of commits land on weekends`,
    "",
    "Check your own:",
  ].join("\n")
}
