"use client"

import useSWR from "swr"
import { BalanceScoreCard } from "@/components/balance-score-card"
import { CommitTimingChart } from "@/components/commit-timing-chart"
import { LanguageBreakdownChart } from "@/components/language-breakdown-chart"
import { StatsOverview } from "@/components/stats-overview"
import { TopReposList } from "@/components/top-repos-list"
import { TimeOfDayPanel } from "@/components/time-of-day-panel"
import { EventBreakdown } from "@/components/event-breakdown"
import Link from "next/link"
import { Loader2, AlertCircle, RefreshCcw, Lock } from "lucide-react"
import { GitHubLogoIcon } from "@radix-ui/react-icons"
import type { AnalysisData } from "@/lib/github"

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(err.error ?? "Failed to fetch")
    }
    return r.json()
  })

interface DashboardClientProps {
  /** Set for a public lookup; omit to analyze the signed-in user. */
  username?: string
  /** True when this visitor is signed in as the account being shown. */
  isOwner?: boolean
}

export function DashboardClient({ username, isOwner = false }: DashboardClientProps) {
  const endpoint = username
    ? `/api/analyze?username=${encodeURIComponent(username)}`
    : "/api/analyze"
  const { data, error, isLoading, mutate } = useSWR<AnalysisData>(endpoint, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-border" />
          <Loader2 className="w-8 h-8 animate-spin text-primary absolute inset-0 m-auto" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">
            {username ? `Analyzing @${username}...` : "Analyzing your GitHub activity..."}
          </p>
          <p className="text-sm text-muted-foreground">Fetching repos, events and computing insights</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <p className="text-sm font-medium text-foreground">Analysis failed</p>
        <p className="text-sm text-muted-foreground max-w-sm text-center">{error.message}</p>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <RefreshCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Public-data notice, with the upgrade path for the account owner */}
      {data.publicOnly && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border bg-card">
          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="flex-1 text-sm text-muted-foreground">
            Built from public activity only. Private repositories and their commits are not
            included.
          </p>
          {!isOwner && (
            <Link
              href="/api/auth"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:border-primary/60 hover:text-primary transition-colors shrink-0"
            >
              <GitHubLogoIcon className="w-4 h-4" />
              Sign in for your full report
            </Link>
          )}
        </div>
      )}

      {/* Stats overview row */}
      <StatsOverview
        totalCommits={data.totalCommits}
        streakDays={data.streakDays}
        avgCommitsPerDay={data.avgCommitsPerDay}
        totalRepos={data.repos.length}
        totalStars={data.totalStars}
        totalForks={data.totalForks}
        longestStreak={data.longestStreak}
        peakHour={data.peakHour}
        mostActiveRepo={data.mostActiveRepo}
        workdayPct={data.workdayPct}
      />

      {/* Balance score + commit timing side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BalanceScoreCard
            score={data.balanceScore}
            weekendCommitPct={data.weekendCommitPct}
            afterHoursCommitPct={data.afterHoursCommitPct}
            lateNightCommitPct={data.lateNightCommitPct}
            earlyBirdPct={data.earlyBirdPct}
            morningPct={data.morningPct}
            afternoonPct={data.afternoonPct}
            eveningPct={data.eveningPct}
            nightPct={data.nightPct}
            workdayPct={data.workdayPct}
            recommendations={data.recommendations}
          />
        </div>
        <div className="lg:col-span-2">
          <CommitTimingChart
            commitsByHour={data.commitsByHour}
            commitsByDay={data.commitsByDay}
            peakHour={data.peakHour}
            peakDay={data.peakDay}
          />
        </div>
      </div>

      {/* Active hours deep dive, full width */}
      <TimeOfDayPanel
        commitsByHour={data.commitsByHour}
        timeSessions={data.timeSessions}
        peakHour={data.peakHour}
        hourlyProductivity={data.hourlyProductivity}
      />

      {/* Event breakdown + language side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EventBreakdown
          eventTypeBreakdown={data.eventTypeBreakdown}
          totalEvents={data.events.length}
        />
        <LanguageBreakdownChart languages={data.languages} topLangs={data.topLangs} />
      </div>

      {/* Top repos full width */}
      <TopReposList repos={data.repos} />
    </div>
  )
}
