import { ImageResponse } from "next/og"
import { readFile } from "fs/promises"
import { join } from "path"
import { siteConfig } from "@/lib/site"

export const alt = `${siteConfig.name}: ${siteConfig.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const BG = "#0d1410"
const PANEL = "#151f19"
const BORDER = "#24332b"
const TEXT = "#e6f0e9"
const MUTED = "#8ba396"
const PRIMARY = "#31b776"

async function logoDataUri(): Promise<string> {
  const file = await readFile(join(process.cwd(), "public", "android-chrome-512x512.png"))
  return `data:image/png;base64,${file.toString("base64")}`
}

export default async function Image() {
  const logo = await logoDataUri()

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
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={72} height={72} alt="" style={{ borderRadius: 16 }} />
          <span style={{ fontSize: 34, fontWeight: 700, color: TEXT }}>{siteConfig.name}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 74, fontWeight: 800, color: TEXT, lineHeight: 1.1 }}>
            Know when you live to code,
          </span>
          <span style={{ fontSize: 74, fontWeight: 800, color: PRIMARY, lineHeight: 1.1 }}>
            and when you don&apos;t.
          </span>
          <span style={{ fontSize: 30, color: MUTED, marginTop: 8 }}>
            Commit timing, active hours, languages and a scored balance report.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {["Balance score", "Peak hours", "Top repos"].map((chip) => (
              <span
                key={chip}
                style={{
                  fontSize: 24,
                  color: TEXT,
                  padding: "12px 22px",
                  borderRadius: 999,
                  background: PANEL,
                  border: `1px solid ${BORDER}`,
                }}
              >
                {chip}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 26, color: PRIMARY }}>coder-life.vercel.app</span>
        </div>
      </div>
    ),
    size
  )
}
