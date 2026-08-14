"use client"

import { useMemo } from "react"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import type { TimeSession } from "@/lib/github"
import { Moon, Sunrise, Sun, Sunset, Coffee } from "lucide-react"

interface TimeOfDayPanelProps {
  commitsByHour: number[]
  timeSessions: TimeSession[]
  peakHour: number
  hourlyProductivity: { hour: number; label: string; commits: number; session: string }[]
}

const SESSION_ICONS = {
  "Early Bird": Sunrise,
  Morning: Coffee,
  Afternoon: Sun,
  Evening: Sunset,
  "Night Owl": Moon,
}

const SESSION_BG: Record<string, string> = {
  "Early Bird": "bg-[oklch(0.78_0.19_55/0.12)] border-[oklch(0.78_0.19_55/0.3)]",
  Morning: "bg-[oklch(0.65_0.22_264/0.12)] border-[oklch(0.65_0.22_264/0.3)]",
  Afternoon: "bg-[oklch(0.70_0.18_155/0.12)] border-[oklch(0.70_0.18_155/0.3)]",
  Evening: "bg-[oklch(0.66_0.20_310/0.12)] border-[oklch(0.66_0.20_310/0.3)]",
  "Night Owl": "bg-[oklch(0.68_0.22_25/0.12)] border-[oklch(0.68_0.22_25/0.3)]",
}

const SESSION_TEXT: Record<string, string> = {
  "Early Bird": "text-[oklch(0.68_0.19_55)]",
  Morning: "text-primary",
  Afternoon: "text-[oklch(0.60_0.18_155)]",
  Evening: "text-[oklch(0.58_0.20_310)]",
  "Night Owl": "text-[oklch(0.68_0.22_25)]",
}

const HOUR_SESSION_COLOR: Record<string, string> = {
  early: "oklch(0.78 0.19 55)",
  morning: "oklch(0.65 0.22 264)",
  afternoon: "oklch(0.70 0.18 155)",
  evening: "oklch(0.66 0.20 310)",
  night: "oklch(0.68 0.22 25)",
}

function getHourSession(hour: number) {
  if (hour >= 5 && hour < 9) return "early"
  if (hour >= 9 && hour < 13) return "morning"
  if (hour >= 13 && hour < 18) return "afternoon"
  if (hour >= 18 && hour < 23) return "evening"
  return "night"
}

interface ClockRingProps {
  commitsByHour: number[]
  peakHour: number
}

function ClockRing({ commitsByHour, peakHour }: ClockRingProps) {
  const size = 220
  const cx = size / 2
  const cy = size / 2
  const maxVal = Math.max(...commitsByHour, 1)

  const arcs = useMemo(() => {
    return commitsByHour.map((count, hour) => {
      const minR = 52
      const maxR = 94
      const barR = minR + ((count / maxVal) * (maxR - minR))
      const angleStep = (2 * Math.PI) / 24
      const startAngle = (hour / 24) * 2 * Math.PI - Math.PI / 2
      const endAngle = startAngle + angleStep * 0.82
      const session = getHourSession(hour)
      const color = HOUR_SESSION_COLOR[session]
      const isPeak = hour === peakHour

      const x1 = cx + minR * Math.cos(startAngle)
      const y1 = cy + minR * Math.sin(startAngle)
      const x2 = cx + barR * Math.cos(startAngle)
      const y2 = cy + barR * Math.sin(startAngle)
      const x3 = cx + barR * Math.cos(endAngle)
      const y3 = cy + barR * Math.sin(endAngle)
      const x4 = cx + minR * Math.cos(endAngle)
      const y4 = cy + minR * Math.sin(endAngle)

      const largeArc = angleStep * 0.82 > Math.PI ? 1 : 0

      return { hour, count, color, isPeak, x1, y1, x2, y2, x3, y3, x4, y4, barR, startAngle, endAngle, largeArc, minR }
    })
  }, [commitsByHour, maxVal, peakHour, cx, cy])

  const labelHours = [0, 6, 12, 18]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={94} fill="none" stroke="var(--border)" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={52} fill="none" stroke="var(--border)" strokeWidth={1} strokeDasharray="2 3" />

      {/* Hour arc bars */}
      {arcs.map(({ hour, count, color, isPeak, x1, y1, x2, y2, x3, y3, x4, y4, largeArc }) => (
        count > 0 ? (
          <path
            key={hour}
            d={`M ${x1} ${y1} L ${x2} ${y2} A ${arcs[hour].barR} ${arcs[hour].barR} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${arcs[hour].minR} ${arcs[hour].minR} 0 ${largeArc} 0 ${x1} ${y1} Z`}
            fill={color}
            opacity={isPeak ? 1 : 0.65}
            stroke={isPeak ? color : "none"}
            strokeWidth={isPeak ? 1 : 0}
            className="transition-opacity hover:opacity-100"
          />
        ) : (
          <path
            key={hour}
            d={`M ${x1} ${y1} L ${cx + 52 * Math.cos(arcs[hour].startAngle)} ${cy + 52 * Math.sin(arcs[hour].startAngle)} A 52 52 0 ${largeArc} 1 ${x4} ${y4} A 52 52 0 ${largeArc} 0 ${x1} ${y1} Z`}
            fill="var(--muted)"
            opacity={0.25}
          />
        )
      ))}

      {/* Hour labels at 0, 6, 12, 18 */}
      {labelHours.map((h) => {
        const angle = (h / 24) * 2 * Math.PI - Math.PI / 2
        const r = 106
        const lx = cx + r * Math.cos(angle)
        const ly = cy + r * Math.sin(angle)
        return (
          <text
            key={h}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={9}
            fill="var(--muted-foreground)"
            fontFamily="var(--font-mono)"
          >
            {h === 0 ? "12am" : h === 12 ? "12pm" : `${h}${h < 12 ? "am" : "pm"}`}
          </text>
        )
      })}

      {/* Center text */}
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">
        Peak
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize={18} fontWeight="700" fill="var(--foreground)" fontFamily="var(--font-mono)">
        {peakHour === 0 ? "12am" : peakHour < 12 ? `${peakHour}am` : peakHour === 12 ? "12pm" : `${peakHour - 12}pm`}
      </text>
    </svg>
  )
}

const chartConfig = {
  commits: { label: "Commits", color: "var(--chart-1)" },
}

export function TimeOfDayPanel({ commitsByHour, timeSessions, peakHour, hourlyProductivity }: TimeOfDayPanelProps) {
  // Build radar data grouped by 4-hour blocks for a cleaner shape
  const radarData = useMemo(() => {
    const blocks = [
      { label: "12–4am", hours: [0, 1, 2, 3] },
      { label: "4–8am", hours: [4, 5, 6, 7] },
      { label: "8am–12pm", hours: [8, 9, 10, 11] },
      { label: "12–4pm", hours: [12, 13, 14, 15] },
      { label: "4–8pm", hours: [16, 17, 18, 19] },
      { label: "8pm–12am", hours: [20, 21, 22, 23] },
    ]
    return blocks.map(({ label, hours }) => ({
      period: label,
      commits: hours.reduce((s, h) => s + commitsByHour[h], 0),
    }))
  }, [commitsByHour])

  const dominantSession = timeSessions.reduce((a, b) => (a.commits > b.commits ? a : b), timeSessions[0])

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Active Hours Deep Dive</h3>
          <p className="text-sm text-muted-foreground mt-0.5">When you do your best work</p>
        </div>
        {dominantSession && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-semibold border ${SESSION_BG[dominantSession.label] ?? ""} ${SESSION_TEXT[dominantSession.label] ?? ""}`}>
            {(() => {
              const Icon = SESSION_ICONS[dominantSession.label as keyof typeof SESSION_ICONS] ?? Sun
              return <Icon className="w-3.5 h-3.5" />
            })()}
            {dominantSession.label}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Clock ring */}
        <div className="flex flex-col items-center gap-3">
          <ClockRing commitsByHour={commitsByHour} peakHour={peakHour} />
          <p className="text-sm text-muted-foreground text-center">
            24-hour activity ring: each bar = commits that hour
          </p>
        </div>

        {/* Radar + session breakdown */}
        <div className="space-y-4">
          <ChartContainer config={chartConfig} className="h-48 w-full">
            <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="period"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
              />
              <Radar
                dataKey="commits"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
                      <p className="font-semibold text-foreground">{payload[0]?.payload?.period}</p>
                      <p className="text-muted-foreground">{payload[0]?.value} commits</p>
                    </div>
                  )
                }}
              />
            </RadarChart>
          </ChartContainer>

          {/* Time session cards */}
          <div className="grid grid-cols-1 gap-2">
            {timeSessions.map((session) => {
              const Icon = SESSION_ICONS[session.label as keyof typeof SESSION_ICONS] ?? Sun
              const isDominant = session.label === dominantSession?.label
              return (
                <div
                  key={session.label}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${isDominant ? `${SESSION_BG[session.label] ?? ""} ${SESSION_TEXT[session.label] ?? ""}` : "border-border bg-secondary/40"}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isDominant ? "" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isDominant ? "" : "text-foreground"}`}>
                        {session.label}
                      </span>
                      <span className={`text-sm font-bold tabular-nums ${isDominant ? "" : "text-foreground"}`}>
                        {session.pct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${session.pct}%`, backgroundColor: session.colorVar }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-14 text-right">
                        {session.hours}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
