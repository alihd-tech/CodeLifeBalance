"use client"

import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react"

interface BalanceScoreCardProps {
  score: number
  weekendCommitPct: number
  afterHoursCommitPct: number
  lateNightCommitPct: number
  earlyBirdPct: number
  morningPct: number
  afternoonPct: number
  eveningPct: number
  nightPct: number
  workdayPct: number
  recommendations: string[]
}

function getScoreMeta(score: number) {
  if (score >= 80) return { label: "Excellent", color: "oklch(0.70 0.18 155)", textClass: "text-[oklch(0.70_0.18_155)]", bgClass: "bg-[oklch(0.70_0.18_155/0.1)] border-[oklch(0.70_0.18_155/0.3)]" }
  if (score >= 60) return { label: "Good", color: "oklch(0.78 0.19 55)", textClass: "text-[oklch(0.78_0.19_55)]", bgClass: "bg-[oklch(0.78_0.19_55/0.1)] border-[oklch(0.78_0.19_55/0.3)]" }
  if (score >= 40) return { label: "Fair", color: "oklch(0.68 0.22 25)", textClass: "text-[oklch(0.68_0.22_25)]", bgClass: "bg-[oklch(0.68_0.22_25/0.1)] border-[oklch(0.68_0.22_25/0.3)]" }
  return { label: "At Risk", color: "oklch(0.70 0.19 22)", textClass: "text-destructive", bgClass: "bg-destructive/10 border-destructive/30" }
}

function ArcGauge({ score, color }: { score: number; color: string }) {
  const size = 160
  const cx = size / 2
  const cy = size / 2 + 14
  const r = 58
  // Arc spans 220 degrees, from -200° to +20° (bottom left to bottom right)
  const startDeg = -200
  const endDeg = 20
  const totalDeg = endDeg - startDeg
  const fillDeg = (score / 100) * totalDeg

  const toRad = (d: number) => (d * Math.PI) / 180

  function arcPath(start: number, end: number, radius: number) {
    const s = toRad(start)
    const e = toRad(end)
    const x1 = cx + radius * Math.cos(s)
    const y1 = cy + radius * Math.sin(s)
    const x2 = cx + radius * Math.cos(e)
    const y2 = cy + radius * Math.sin(e)
    const large = end - start > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`
  }

  // Track marks
  const ticks = [0, 25, 50, 75, 100]

  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`} className="overflow-visible">
      {/* Background track */}
      <path
        d={arcPath(startDeg, endDeg, r)}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={12}
        strokeLinecap="round"
      />
      {/* Fill arc */}
      <path
        d={arcPath(startDeg, startDeg + fillDeg, r)}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
      />
      {/* Tick marks */}
      {ticks.map((t) => {
        const angle = toRad(startDeg + (t / 100) * totalDeg)
        const outerR = r + 10
        const innerR = r - 10
        return (
          <line
            key={t}
            x1={cx + innerR * Math.cos(angle)}
            y1={cy + innerR * Math.sin(angle)}
            x2={cx + outerR * Math.cos(angle)}
            y2={cy + outerR * Math.sin(angle)}
            stroke="var(--border)"
            strokeWidth={1.5}
          />
        )
      })}
      {/* Center score */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={32} fontWeight="800" fill="var(--foreground)" fontFamily="var(--font-mono)">
        {score}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">
        out of 100
      </text>
      {/* Labels */}
      <text x={cx - r - 8} y={cy + 10} textAnchor="middle" fontSize={8} fill="var(--muted-foreground)">At risk</text>
      <text x={cx + r + 8} y={cy + 10} textAnchor="middle" fontSize={8} fill="var(--muted-foreground)">Healthy</text>
    </svg>
  )
}

export function BalanceScoreCard({
  score,
  weekendCommitPct,
  afterHoursCommitPct,
  lateNightCommitPct,
  earlyBirdPct,
  morningPct,
  afternoonPct,
  eveningPct,
  nightPct,
  workdayPct,
  recommendations,
}: BalanceScoreCardProps) {
  const { label, color, textClass, bgClass } = getScoreMeta(score)

  const metrics = [
    {
      label: "Work hours",
      value: `${workdayPct}%`,
      sub: "9am–6pm",
      good: workdayPct >= 50,
      goodText: "healthy range",
      warnText: "low work-hour activity",
    },
    {
      label: "After-hours",
      value: `${afterHoursCommitPct}%`,
      sub: "outside 9–6pm",
      good: afterHoursCommitPct <= 40,
      goodText: "in check",
      warnText: afterHoursCommitPct > 40 ? "high" : "moderate",
    },
    {
      label: "Weekends",
      value: `${weekendCommitPct}%`,
      sub: "Sat & Sun",
      good: weekendCommitPct <= 30,
      goodText: "healthy",
      warnText: "high weekend usage",
    },
    {
      label: "Late night",
      value: `${lateNightCommitPct}%`,
      sub: "11pm–4am",
      good: lateNightCommitPct <= 10,
      goodText: "low",
      warnText: "affects sleep quality",
    },
  ]

  const sessionBars = [
    { label: "Early Bird", pct: earlyBirdPct, color: "oklch(0.78 0.19 55)" },
    { label: "Morning", pct: morningPct, color: "oklch(0.65 0.22 264)" },
    { label: "Afternoon", pct: afternoonPct, color: "oklch(0.70 0.18 155)" },
    { label: "Evening", pct: eveningPct, color: "oklch(0.66 0.20 310)" },
    { label: "Night", pct: nightPct, color: "oklch(0.68 0.22 25)" },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Work-Life Balance</p>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-sm font-semibold border ${bgClass} ${textClass}`}>
          {label}
        </div>
      </div>

      {/* Arc gauge */}
      <div className="flex justify-center">
        <ArcGauge score={score} color={color} />
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-2 gap-2">
        {metrics.map(({ label: ml, value, sub, good, goodText, warnText }) => (
          <div
            key={ml}
            className={`rounded-lg p-3 border transition-colors ${
              good
                ? "border-[oklch(0.70_0.18_155/0.3)] bg-[oklch(0.70_0.18_155/0.05)]"
                : "border-[oklch(0.68_0.22_25/0.3)] bg-[oklch(0.68_0.22_25/0.05)]"
            }`}
          >
            <div className={`text-lg font-bold font-mono ${good ? "text-[oklch(0.70_0.18_155)]" : "text-[oklch(0.68_0.22_25)]"}`}>
              {value}
            </div>
            <div className="text-sm font-medium text-foreground mt-0.5">{ml}</div>
            <div className="text-xs text-muted-foreground">{sub}</div>
            <div className={`text-xs mt-1 font-medium ${good ? "text-[oklch(0.70_0.18_155)]" : "text-[oklch(0.68_0.22_25)]"}`}>
              {good ? goodText : warnText}
            </div>
          </div>
        ))}
      </div>

      {/* Session distribution mini bars */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Time distribution</p>
        {sessionBars.map(({ label: sl, pct, color: sc }) => (
          <div key={sl} className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-20 flex-shrink-0">{sl}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: sc }}
              />
            </div>
            <span className="text-sm text-foreground font-mono w-8 text-right flex-shrink-0">{pct}%</span>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Insights
        </p>
        {recommendations.map((rec, i) => {
          const isPositive = score >= 70 && i === 0
          return (
            <div key={i} className="flex items-start gap-2 text-sm">
              {isPositive ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.70_0.18_155)] flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.68_0.22_25)] flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed text-muted-foreground text-sm">{rec}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
