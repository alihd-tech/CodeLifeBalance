"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import type { Event } from "@/lib/github"
import { useMemo, useState } from "react"

interface ActivityHeatmapProps {
  events: Event[]
  weeklyActivity: { week: string; commits: number }[]
}

const chartConfig = {
  commits: { label: "Commits", color: "var(--chart-1)" },
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DAYS_LABEL = ["S", "M", "T", "W", "T", "F", "S"]
const NUM_WEEKS = 26

function getCellColor(count: number, max: number) {
  if (count === 0) return null
  const ratio = count / max
  if (ratio < 0.25) return "oklch(0.65 0.22 264 / 0.2)"
  if (ratio < 0.5) return "oklch(0.65 0.22 264 / 0.45)"
  if (ratio < 0.75) return "oklch(0.65 0.22 264 / 0.7)"
  return "oklch(0.65 0.22 264)"
}

export function ActivityHeatmap({ events, weeklyActivity }: ActivityHeatmapProps) {
  const [view, setView] = useState<"trend" | "monthly">("trend")

  const { cells, weeks, maxCount } = useMemo(() => {
    const dayMap: Record<string, number> = {}
    for (const evt of events) {
      if (evt.type === "PushEvent") {
        const day = new Date(evt.created_at).toISOString().slice(0, 10)
        dayMap[day] = (dayMap[day] || 0) + (evt.payload.size ?? evt.payload.commits?.length ?? 1)
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endDay = new Date(today)
    endDay.setDate(today.getDate() + (6 - today.getDay()))

    const totalDays = NUM_WEEKS * 7
    const startDay = new Date(endDay)
    startDay.setDate(endDay.getDate() - totalDays + 1)

    const cells: { date: string; count: number; col: number; row: number }[] = []
    const weekLabels: { col: number; label: string }[] = []
    let prevMonth = -1

    for (let d = 0; d < totalDays; d++) {
      const cur = new Date(startDay)
      cur.setDate(startDay.getDate() + d)
      const dateStr = cur.toISOString().slice(0, 10)
      const col = Math.floor(d / 7)
      const row = cur.getDay()
      const count = dayMap[dateStr] || 0
      cells.push({ date: dateStr, count, col, row })

      if (cur.getMonth() !== prevMonth && (row === 0 || d === 0)) {
        weekLabels.push({ col, label: MONTHS[cur.getMonth()] })
        prevMonth = cur.getMonth()
      }
    }

    const maxCount = Math.max(...cells.map((c) => c.count), 1)
    return { cells, weeks: weekLabels, maxCount }
  }, [events])

  // Monthly aggregation for the bar chart
  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const evt of events) {
      if (evt.type === "PushEvent") {
        const d = new Date(evt.created_at)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        map[key] = (map[key] || 0) + (evt.payload.size ?? evt.payload.commits?.length ?? 1)
      }
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, commits]) => ({
        month: MONTHS[parseInt(key.split("-")[1]) - 1] + " " + key.split("-")[0].slice(2),
        commits,
      }))
  }, [events])

  const maxMonthly = Math.max(...monthlyData.map((m) => m.commits), 1)

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Contribution Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last {NUM_WEEKS} weeks of push events</p>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-secondary border border-border">
          {(["trend", "monthly"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                view === v
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "trend" ? "Weekly trend" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Month labels */}
          <div className="flex mb-1 ml-6">
            {Array.from({ length: NUM_WEEKS }, (_, col) => {
              const monthEntry = weeks.find((w) => w.col === col)
              return (
                <div key={col} className="w-[18px] mr-[2px] text-[9px] text-muted-foreground">
                  {monthEntry?.label ?? ""}
                </div>
              )
            })}
          </div>

          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1.5">
              {DAYS_LABEL.map((d, i) => (
                <div
                  key={i}
                  className="w-4 h-4 text-[9px] text-muted-foreground flex items-center justify-center"
                >
                  {i % 2 === 1 ? d : ""}
                </div>
              ))}
            </div>

            {/* Columns (weeks) */}
            {Array.from({ length: NUM_WEEKS }, (_, col) => (
              <div key={col} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }, (_, row) => {
                  const cell = cells.find((c) => c.col === col && c.row === row)
                  const bgColor = cell && cell.count > 0 ? getCellColor(cell.count, maxCount) : null
                  return (
                    <div
                      key={row}
                      title={cell ? `${cell.date}: ${cell.count} commits` : ""}
                      className="w-4 h-4 rounded-sm transition-colors"
                      style={{
                        backgroundColor: bgColor ?? "var(--muted)",
                        opacity: bgColor ? 1 : 0.35,
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 ml-6">
            <span className="text-[10px] text-muted-foreground">Less</span>
            {[0.2, 0.45, 0.7, 1].map((op, i) => (
              <div
                key={i}
                className="w-3.5 h-3.5 rounded-sm"
                style={{ backgroundColor: `oklch(0.65 0.22 264 / ${op})` }}
              />
            ))}
            <span className="text-[10px] text-muted-foreground">More</span>
          </div>
        </div>
      </div>

      {/* Toggle chart */}
      <div className="border-t border-border pt-4">
        {view === "trend" && weeklyActivity.length > 0 && (
          <>
            <p className="text-xs font-medium text-muted-foreground mb-3">Weekly commit trend</p>
            <ChartContainer config={chartConfig} className="h-32 w-full">
              <AreaChart
                data={weeklyActivity}
                margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="commitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => v.slice(5)}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltipContent nameKey="commits" />}
                  cursor={{ stroke: "var(--border)" }}
                />
                <Area
                  type="monotone"
                  dataKey="commits"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#commitGrad)"
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          </>
        )}

        {view === "monthly" && monthlyData.length > 0 && (
          <>
            <p className="text-xs font-medium text-muted-foreground mb-3">Monthly commits (last 12 months)</p>
            <ChartContainer config={chartConfig} className="h-32 w-full">
              <BarChart
                data={monthlyData}
                margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltipContent nameKey="commits" />}
                  cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                />
                <Bar dataKey="commits" radius={[3, 3, 0, 0]} maxBarSize={28}>
                  {monthlyData.map((entry, i) => (
                    <Cell
                      key={`m-${i}`}
                      fill="var(--chart-1)"
                      opacity={0.4 + (entry.commits / maxMonthly) * 0.6}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </>
        )}
      </div>
    </div>
  )
}
