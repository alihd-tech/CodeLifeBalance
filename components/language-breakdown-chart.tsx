"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"

interface LanguageBreakdownChartProps {
  languages: Record<string, number>
  topLangs: { name: string; count: number; pct: number }[]
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "oklch(0.55 0.22 264)",
  JavaScript: "oklch(0.78 0.19 55)",
  Python: "oklch(0.62 0.17 155)",
  Rust: "oklch(0.62 0.18 38)",
  Go: "oklch(0.65 0.17 200)",
  Java: "oklch(0.58 0.18 25)",
  "C++": "oklch(0.58 0.18 310)",
  C: "oklch(0.55 0.10 230)",
  Ruby: "oklch(0.60 0.22 15)",
  PHP: "oklch(0.62 0.13 290)",
  Swift: "oklch(0.68 0.20 40)",
  Kotlin: "oklch(0.58 0.20 280)",
  HTML: "oklch(0.68 0.20 38)",
  CSS: "oklch(0.58 0.20 265)",
  Shell: "oklch(0.60 0.12 140)",
  Dockerfile: "oklch(0.55 0.18 210)",
  Vue: "oklch(0.62 0.18 155)",
  SCSS: "oklch(0.62 0.18 330)",
  Dart: "oklch(0.60 0.18 215)",
}

const FALLBACK_COLORS = [
  "oklch(0.55 0.22 264)",
  "oklch(0.70 0.18 155)",
  "oklch(0.78 0.19 55)",
  "oklch(0.68 0.22 25)",
  "oklch(0.66 0.20 310)",
  "oklch(0.62 0.18 200)",
  "oklch(0.60 0.22 15)",
  "oklch(0.58 0.18 290)",
]

const chartConfig = Object.fromEntries(
  Object.entries(LANG_COLORS).map(([k, v]) => [k, { label: k, color: v }])
)

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { name: string; value: number; payload: { pct: number } }[]
}) {
  if (!active || !payload?.length) return null
  const { name, value, payload: p } = payload[0]
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <span className="font-semibold text-foreground">{name}</span>
      <div className="text-muted-foreground">
        {value} repo{value !== 1 ? "s" : ""} &bull; {p.pct}%
      </div>
    </div>
  )
}

export function LanguageBreakdownChart({ languages, topLangs }: LanguageBreakdownChartProps) {
  const total = Object.values(languages).reduce((a, b) => a + b, 0)

  const data = (topLangs.length > 0 ? topLangs : Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({
      name,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
  ).map((d, i) => ({
    ...d,
    value: d.count,
    color: LANG_COLORS[d.name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }))

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-center h-48">
        <p className="text-sm text-muted-foreground">No language data available</p>
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Language Breakdown</h3>
        <p className="text-xs text-muted-foreground mt-0.5">By number of repositories</p>
      </div>

      <div className="flex gap-4 items-center">
        {/* Donut */}
        <ChartContainer config={chartConfig} className="h-44 w-44 flex-shrink-0">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={72}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ChartContainer>

        {/* Bar rows */}
        <div className="flex-1 space-y-2 min-w-0">
          {data.map((entry) => (
            <div key={entry.name} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs font-medium text-foreground truncate">{entry.name}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono flex-shrink-0 ml-2">{entry.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(entry.count / maxCount) * 100}%`,
                    backgroundColor: entry.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
