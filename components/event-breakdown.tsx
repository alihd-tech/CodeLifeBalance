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

interface EventBreakdownProps {
  eventTypeBreakdown: { type: string; count: number; label: string }[]
  totalEvents: number
}

const EVENT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.62 0.18 200)",
]

const chartConfig = {
  count: { label: "Events", color: "var(--chart-1)" },
}

export function EventBreakdown({ eventTypeBreakdown, totalEvents }: EventBreakdownProps) {
  if (!eventTypeBreakdown.length) return null

  const data = eventTypeBreakdown.map((e) => ({
    ...e,
    pct: totalEvents > 0 ? Math.round((e.count / totalEvents) * 100) : 0,
  }))

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Activity Breakdown</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {totalEvents} total GitHub events in visible window
        </p>
      </div>

      <ChartContainer config={chartConfig} className="h-44 w-full">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 32, left: 4, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={76}
          />
          <Tooltip
            content={<ChartTooltipContent nameKey="count" />}
            cursor={{ fill: "var(--muted)", opacity: 0.3 }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((_, index) => (
              <Cell
                key={`cell-evt-${index}`}
                fill={EVENT_COLORS[index % EVENT_COLORS.length]}
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      {/* Percentage pills */}
      <div className="flex flex-wrap gap-2">
        {data.map((e, i) => (
          <div
            key={e.type}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-secondary/50 text-xs"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: EVENT_COLORS[i % EVENT_COLORS.length] }}
            />
            <span className="text-foreground font-medium">{e.label}</span>
            <span className="text-muted-foreground">{e.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
