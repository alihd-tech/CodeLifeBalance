import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { decodeShareCard, chronotype, formatHour, scoreLabel } from "@/lib/share"

export const contentType = "image/png"

// Card palette, in plain hex: the OG renderer does not understand oklch().
const BG = "#0d1410"
const PANEL = "#151f19"
const BORDER = "#24332b"
const TEXT = "#e6f0e9"
const MUTED = "#8ba396"
const PRIMARY = "#3ecf8e"

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "20px 24px",
        borderRadius: 16,
        background: PANEL,
        border: `1px solid ${BORDER}`,
        flex: 1,
      }}
    >
      <span style={{ fontSize: 34, fontWeight: 700, color: TEXT }}>{value}</span>
      <span style={{ fontSize: 18, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </span>
    </div>
  )
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t")
  const card = token ? decodeShareCard(token) : null

  if (!card) {
    return new Response("Invalid or unsigned share token", { status: 400 })
  }

  const ringPct = Math.max(0, Math.min(100, card.s))

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          padding: 56,
          fontFamily: "sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {card.a ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.a}
                width={72}
                height={72}
                style={{ borderRadius: 999, border: `2px solid ${PRIMARY}` }}
                alt=""
              />
            ) : null}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 38, fontWeight: 700, color: TEXT }}>
                {card.n || card.u}
              </span>
              <span style={{ fontSize: 24, color: MUTED }}>@{card.u}</span>
            </div>
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, color: PRIMARY }}>Code Life Balance</span>
        </div>

        {/* Score */}
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 220,
              height: 220,
              borderRadius: 999,
              background: `conic-gradient(${PRIMARY} ${ringPct * 3.6}deg, ${BORDER} 0deg)`,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: 184,
                height: 184,
                borderRadius: 999,
                background: BG,
              }}
            >
              <span style={{ fontSize: 76, fontWeight: 800, color: TEXT, lineHeight: 1 }}>
                {card.s}
              </span>
              <span style={{ fontSize: 20, color: MUTED }}>/ 100</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 46, fontWeight: 800, color: TEXT }}>
              {scoreLabel(card.s)}
            </span>
            <span style={{ fontSize: 30, color: PRIMARY }}>
              {chronotype(card)} - peaks at {formatHour(card.ph)}
            </span>
            <span style={{ fontSize: 26, color: MUTED }}>
              {card.wk}% weekend commits - {card.np}% after dark
              {card.l ? ` - mostly ${card.l}` : ""}
            </span>
          </div>
        </div>

        {/* Stat row */}
        <div style={{ display: "flex", gap: 20 }}>
          <Stat label="Commits" value={card.c.toLocaleString()} />
          <Stat label="Repos" value={card.r.toLocaleString()} />
          <Stat label="Streak" value={`${card.st}d`} />
          <Stat label="Longest" value={`${card.ls}d`} />
          <Stat label="Workday" value={`${card.wp}%`} />
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
