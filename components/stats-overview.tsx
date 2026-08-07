"use client"

import { GitCommitHorizontal, Flame, TrendingUp, GitFork, Star, Zap, Clock, BookOpen } from "lucide-react"

interface StatsOverviewProps {
  totalCommits: number
  streakDays: number
  avgCommitsPerDay: number
  totalRepos: number
  totalStars: number
  totalForks: number
  longestStreak: number
  peakHour: number
  mostActiveRepo: string | null
  workdayPct: number
}

function formatHour(h: number) {
  if (h === 0) return "12am"
  if (h < 12) return `${h}am`
  if (h === 12) return "12pm"
  return `${h - 12}pm`
}

export function StatsOverview({
  totalCommits,
  streakDays,
  avgCommitsPerDay,
  totalRepos,
  totalStars,
  totalForks,
  longestStreak,
  peakHour,
  mostActiveRepo,
  workdayPct,
}: StatsOverviewProps) {
  const stats = [
    {
      icon: GitCommitHorizontal,
      label: "Commits",
      value: totalCommits.toLocaleString(),
      sub: "from visible events",
      color: "text-[oklch(0.65_0.22_264)]",
      bg: "bg-[oklch(0.65_0.22_264/0.1)]",
    },
    {
      icon: Flame,
      label: "Current streak",
      value: `${streakDays}d`,
      sub: `longest: ${longestStreak}d`,
      color: "text-[oklch(0.68_0.22_25)]",
      bg: "bg-[oklch(0.68_0.22_25/0.1)]",
    },
    {
      icon: TrendingUp,
      label: "Avg / day",
      value: avgCommitsPerDay.toString(),
      sub: "last 30 days",
      color: "text-[oklch(0.70_0.18_155)]",
      bg: "bg-[oklch(0.70_0.18_155/0.1)]",
    },
    {
      icon: Clock,
      label: "Peak hour",
      value: formatHour(peakHour),
      sub: "most commits",
      color: "text-[oklch(0.78_0.19_55)]",
      bg: "bg-[oklch(0.78_0.19_55/0.1)]",
    },
    {
      icon: Star,
      label: "Total stars",
      value: totalStars >= 1000 ? `${(totalStars / 1000).toFixed(1)}k` : totalStars.toString(),
      sub: "across all repos",
      color: "text-[oklch(0.78_0.19_55)]",
      bg: "bg-[oklch(0.78_0.19_55/0.1)]",
    },
    {
      icon: GitFork,
      label: "Total forks",
      value: totalForks.toLocaleString(),
      sub: "repositories forked",
      color: "text-[oklch(0.66_0.20_310)]",
      bg: "bg-[oklch(0.66_0.20_310/0.1)]",
    },
    {
      icon: BookOpen,
      label: "Repos",
      value: totalRepos.toLocaleString(),
      sub: "owned",
      color: "text-[oklch(0.65_0.22_264)]",
      bg: "bg-[oklch(0.65_0.22_264/0.1)]",
    },
    {
      icon: Zap,
      label: "Work hours",
      value: `${workdayPct}%`,
      sub: "9am–6pm commits",
      color: "text-[oklch(0.70_0.18_155)]",
      bg: "bg-[oklch(0.70_0.18_155/0.1)]",
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {stats.map(({ icon: Icon, label, value, sub, color, bg }) => (
        <div key={label} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors">
          <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground font-mono leading-none">{value}</div>
            <div className="text-xs font-medium text-foreground mt-1">{label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
