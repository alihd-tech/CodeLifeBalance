"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

interface CommitTimingChartProps {
  commitsByHour: number[]
  commitsByDay: number[]
  peakHour: number
  peakDay: number
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const chartConfig = {
  commits: { label: "Commits", color: "var(--chart-1)" },
  dayCommits: { label: "Commits", color: "var(--chart-2)" },
}

function getHourColor(hour: number, isPeak: boolean) {
  if (isPeak) return "var(--chart-4)"
  if (hour >= 5 && hour < 9) return "var(--chart-3)"
  if (hour >= 9 && hour < 18) return "var(--chart-1)"
  if (hour >= 18 && hour < 23) return "var(--chart-5)"
  return "var(--chart-4)"
}

function getHourOpacity(hour: number, isPeak: boolean) {
  if (isPeak) return 1
  if (hour >= 9 && hour < 18) return 0.9
  return 0.55
}

export function CommitTimingChart({ commitsByHour, commitsByDay, peakHour, peakDay }: CommitTimingChartProps) {
  const hourData = commitsByHour.map((commits, hour) => ({
    hour: hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`,
    rawHour: hour,
    commits,
    isWorkHour: hour >= 9 && hour < 18,
    isPeak: hour === peakHour,
  }))

  const dayData = commitsByDay.map((commits, i) => ({
    day: DAYS[i],
    fullDay: DAYS_FULL[i],
    dayIndex: i,
    commits,
    isWeekend: i === 0 || i === 6,
    isPeak: i === peakDay,
  }))

  // Build a day×hour matrix for the heatmap (simplified: 7 rows x 24 cols would be too granular,
  // use 7 rows x 8 time-blocks of 3h each)
  const timeBlocks = [
    { label: "12–3am", hours: [0, 1, 2] },
    { label: "3–6am", hours: [3, 4, 5] },
    { label: "6–9am", hours: [6, 7, 8] },
    { label: "9am–12", hours: [9, 10, 11] },
    { label: "12–3pm", hours: [12, 13, 14] },
    { label: "3–6pm", hours: [15, 16, 17] },
    { label: "6–9pm", hours: [18, 19, 20] },
    { label: "9pm–12", hours: [21, 22, 23] },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      {/* Hour bar chart */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Hourly Commit Pattern</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "var(--chart-1)" }} />
                work hours
              </span>
              {" · "}
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "var(--chart-5)" }} />
                evening
              </span>
              {" · "}
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "var(--chart-4)" }} />
                night / peak
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Peak hour</p>
            <p className="text-sm font-bold text-foreground font-mono">
              {peakHour === 0 ? "12am" : peakHour < 12 ? `${peakHour}am` : peakHour === 12 ? "12pm" : `${peakHour - 12}pm`}
            </p>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-44 w-full">
          <BarChart data={hourData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<ChartTooltipContent nameKey="commits" />}
              cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            />
            <Bar dataKey="commits" radius={[3, 3, 0, 0]} maxBarSize={18}>
              {hourData.map((entry, index) => (
                <Cell
                  key={`cell-h-${index}`}
                  fill={getHourColor(entry.rawHour, entry.isPeak)}
                  opacity={getHourOpacity(entry.rawHour, entry.isPeak)}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Day of week bar chart */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Day of Week Pattern</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Weekends highlighted: orange bars indicate reduced work boundaries
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Most active</p>
            <p className="text-sm font-bold text-foreground">{DAYS_FULL[peakDay]}</p>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-40 w-full">
          <BarChart data={dayData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<ChartTooltipContent nameKey="dayCommits" />}
              cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            />
            <Bar dataKey="commits" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {dayData.map((entry, index) => (
                <Cell
                  key={`cell-d-${index}`}
                  fill={
                    entry.isPeak
                      ? "var(--chart-4)"
                      : entry.isWeekend
                      ? "var(--chart-3)"
                      : "var(--chart-1)"
                  }
                  opacity={entry.isPeak ? 1 : entry.isWeekend ? 0.75 : 0.9}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Time-block heatmap grid */}
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground text-sm">Hourly Distribution by Time Block</h3>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div className="flex gap-0.5 mb-1">
              <div className="w-8" />
              {timeBlocks.map((tb) => (
                <div
                  key={tb.label}
                  className="w-14 text-[11px] text-muted-foreground text-center"
                >
                  {tb.label}
                </div>
              ))}
            </div>
            {dayData.map((d) => {
              const rowMax = Math.max(
                ...timeBlocks.map((tb) => tb.hours.reduce((s, h) => s + commitsByHour[h], 0)),
                1
              )
              return (
                <div key={d.day} className="flex gap-0.5 mb-0.5">
                  <div className="w-8 text-xs text-muted-foreground flex items-center">{d.day}</div>
                  {timeBlocks.map((tb) => {
                    // Weight by day: scale down by day-of-week relative contribution
                    const blockTotal = tb.hours.reduce((s, h) => s + commitsByHour[h], 0)
                    const dayFraction = commitsByDay[d.dayIndex] / Math.max(...commitsByDay, 1)
                    const scaled = blockTotal * dayFraction
                    const intensity = rowMax > 0 ? scaled / rowMax : 0
                    const opacity = intensity < 0.05 ? 0.08 : 0.12 + intensity * 0.88
                    return (
                      <div
                        key={tb.label}
                        className="w-14 h-6 rounded flex items-center justify-center text-[11px] font-mono transition-all"
                        style={{
                          backgroundColor: `oklch(0.65 0.22 264 / ${opacity})`,
                          color: intensity > 0.6 ? "var(--primary-foreground)" : "var(--muted-foreground)",
                        }}
                        title={`${d.fullDay} ${tb.label}: ~${Math.round(scaled)} commits`}
                      >
                        {scaled > 0.5 ? Math.round(scaled) : ""}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Estimated commits per time block per day (scaled from aggregate data)</p>
      </div>
    </div>
  )
}
