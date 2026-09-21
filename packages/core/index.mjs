/**
 * Provider-agnostic Code Life Balance analytics engine.
 *
 * This module intentionally has no GitHub SDK, network, filesystem, telemetry,
 * or framework dependency. Give it normalized repositories + events and it
 * returns the same analysis used by the web app and GitHub Action.
 */

export const DEFAULT_ANALYSIS_CONFIG = Object.freeze({
  timeZone: "UTC",
  workdayStartHour: 9,
  workdayEndHour: 18,
  lateNightStartHour: 23,
  lateNightEndHour: 4,
})

const DAY_INDEX = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

const EVENT_LABELS = {
  PushEvent: "Pushes",
  PullRequestEvent: "Pull Requests",
  IssuesEvent: "Issues",
  CreateEvent: "Branches/Tags",
  DeleteEvent: "Deletes",
  WatchEvent: "Stars Given",
  ForkEvent: "Forks",
  IssueCommentEvent: "Comments",
  PullRequestReviewEvent: "PR Reviews",
  ReleaseEvent: "Releases",
}

function normalizeConfig(config = {}) {
  const merged = { ...DEFAULT_ANALYSIS_CONFIG, ...config }

  if (!Number.isInteger(merged.workdayStartHour) || merged.workdayStartHour < 0 || merged.workdayStartHour > 23) {
    throw new Error("workdayStartHour must be an integer from 0 to 23")
  }
  if (!Number.isInteger(merged.workdayEndHour) || merged.workdayEndHour < 1 || merged.workdayEndHour > 24) {
    throw new Error("workdayEndHour must be an integer from 1 to 24")
  }
  if (merged.workdayStartHour >= merged.workdayEndHour) {
    throw new Error("workdayStartHour must be earlier than workdayEndHour")
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: merged.timeZone }).format(new Date())
  } catch {
    throw new Error(`Invalid time zone: ${merged.timeZone}`)
  }

  return merged
}

function getZonedParts(value, timeZone) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid event timestamp: ${String(value)}`)
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date)

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    dayIndex: DAY_INDEX[map.weekday],
  }
}

function dateKey(parts) {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`
}

function weekStartKey(parts) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  const day = date.getUTCDay()
  const delta = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

function getHourSession(hour) {
  if (hour >= 5 && hour < 9) return "early"
  if (hour >= 9 && hour < 13) return "morning"
  if (hour >= 13 && hour < 18) return "afternoon"
  if (hour >= 18 && hour < 23) return "evening"
  return "night"
}

function formatHour(hour) {
  if (hour === 0) return "12am"
  if (hour < 12) return `${hour}am`
  if (hour === 12) return "12pm"
  return `${hour - 12}pm`
}

function isLateNight(hour, start, end) {
  if (start === end) return true
  if (start < end) return hour >= start && hour < end
  return hour >= start || hour < end
}

function safePct(value, total) {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

/**
 * Compute Code Life Balance metrics from normalized repository and event data.
 *
 * @param {Array<object>} repos
 * @param {Array<object>} events
 * @param {object} [config]
 * @returns {object}
 */
export function computeAnalysis(repos, events, config = {}) {
  const settings = normalizeConfig(config)
  const now = config.now ? new Date(config.now) : new Date()

  const languages = {}
  for (const repo of repos) {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1
    }
  }

  const pushEvents = events.filter((event) => event.type === "PushEvent")
  const commitsByHour = new Array(24).fill(0)
  const commitsByDay = new Array(7).fill(0)
  const weekMap = {}
  const repoCommitMap = {}

  for (const event of pushEvents) {
    const parts = getZonedParts(event.created_at, settings.timeZone)
    const commits = event.payload?.size ?? event.payload?.commits?.length ?? 1

    commitsByHour[parts.hour] += commits
    commitsByDay[parts.dayIndex] += commits
    repoCommitMap[event.repo?.name ?? "unknown"] = (repoCommitMap[event.repo?.name ?? "unknown"] || 0) + commits

    const week = weekStartKey(parts)
    weekMap[week] = (weekMap[week] || 0) + commits
  }

  const weeklyActivity = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-26)
    .map(([week, commits]) => ({ week, commits }))

  const totalCommits = commitsByHour.reduce((sum, count) => sum + count, 0)
  const peakHour = commitsByHour.indexOf(Math.max(...commitsByHour))
  const peakDay = commitsByDay.indexOf(Math.max(...commitsByDay))

  const eventDates = new Set(
    events.map((event) => dateKey(getZonedParts(event.created_at, settings.timeZone)))
  )

  const todayParts = getZonedParts(now, settings.timeZone)
  const todayUtc = new Date(Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day))
  let streakDays = 0
  for (let i = 0; i < 365; i++) {
    const cursor = new Date(todayUtc)
    cursor.setUTCDate(todayUtc.getUTCDate() - i)
    if (eventDates.has(cursor.toISOString().slice(0, 10))) {
      streakDays++
    } else {
      break
    }
  }

  const allDays = Array.from(eventDates).sort()
  let longestStreak = 0
  let currentStreak = 0
  for (let i = 0; i < allDays.length; i++) {
    if (i === 0) {
      currentStreak = 1
      longestStreak = 1
      continue
    }
    const previous = new Date(`${allDays[i - 1]}T00:00:00Z`)
    const current = new Date(`${allDays[i]}T00:00:00Z`)
    const diff = (current.getTime() - previous.getTime()) / 86_400_000
    currentStreak = diff === 1 ? currentStreak + 1 : 1
    longestStreak = Math.max(longestStreak, currentStreak)
  }

  const last30 = new Date(now.getTime() - 30 * 86_400_000)
  const recentCommits = pushEvents
    .filter((event) => new Date(event.created_at) >= last30)
    .reduce((sum, event) => sum + (event.payload?.size ?? event.payload?.commits?.length ?? 1), 0)
  const avgCommitsPerDay = Math.round((recentCommits / 30) * 10) / 10

  const earlyBirdCommits = [5, 6, 7, 8].reduce((sum, hour) => sum + commitsByHour[hour], 0)
  const morningCommits = [9, 10, 11, 12].reduce((sum, hour) => sum + commitsByHour[hour], 0)
  const afternoonCommits = [13, 14, 15, 16, 17].reduce((sum, hour) => sum + commitsByHour[hour], 0)
  const eveningCommits = [18, 19, 20, 21, 22].reduce((sum, hour) => sum + commitsByHour[hour], 0)
  const nightCommits = [0, 1, 2, 3, 4, 23].reduce((sum, hour) => sum + commitsByHour[hour], 0)

  const earlyBirdPct = safePct(earlyBirdCommits, totalCommits)
  const morningPct = safePct(morningCommits, totalCommits)
  const afternoonPct = safePct(afternoonCommits, totalCommits)
  const eveningPct = safePct(eveningCommits, totalCommits)
  const nightPct = safePct(nightCommits, totalCommits)
  const workdayCommits = commitsByHour
    .slice(settings.workdayStartHour, settings.workdayEndHour)
    .reduce((sum, count) => sum + count, 0)
  const workdayPct = safePct(workdayCommits, totalCommits)

  const timeSessions = [
    { label: "Early Bird", hours: "5am–9am", commits: earlyBirdCommits, pct: earlyBirdPct, colorVar: "var(--chart-3)" },
    { label: "Morning", hours: "9am–1pm", commits: morningCommits, pct: morningPct, colorVar: "var(--chart-1)" },
    { label: "Afternoon", hours: "1pm–6pm", commits: afternoonCommits, pct: afternoonPct, colorVar: "var(--chart-2)" },
    { label: "Evening", hours: "6pm–11pm", commits: eveningCommits, pct: eveningPct, colorVar: "var(--chart-5)" },
    { label: "Night Owl", hours: "11pm–5am", commits: nightCommits, pct: nightPct, colorVar: "var(--chart-4)" },
  ]

  const hourlyProductivity = commitsByHour.map((commits, hour) => ({
    hour,
    label: formatHour(hour),
    commits,
    session: getHourSession(hour),
  }))

  const weekendCommits = commitsByDay[0] + commitsByDay[6]
  const weekendCommitPct = safePct(weekendCommits, totalCommits)

  let afterHoursCommits = 0
  let lateNightCommits = 0
  for (let hour = 0; hour < 24; hour++) {
    if (hour < settings.workdayStartHour || hour >= settings.workdayEndHour) {
      afterHoursCommits += commitsByHour[hour]
    }
    if (isLateNight(hour, settings.lateNightStartHour, settings.lateNightEndHour)) {
      lateNightCommits += commitsByHour[hour]
    }
  }
  const afterHoursCommitPct = safePct(afterHoursCommits, totalCommits)
  const lateNightCommitPct = safePct(lateNightCommits, totalCommits)

  const typeCounts = {}
  for (const event of events) {
    typeCounts[event.type] = (typeCounts[event.type] || 0) + 1
  }
  const eventTypeBreakdown = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([type, count]) => ({
      type,
      count,
      label: EVENT_LABELS[type] ?? type.replace("Event", ""),
    }))

  const mostActiveRepoEntry = Object.entries(repoCommitMap).sort(([, a], [, b]) => b - a)[0]
  const mostActiveRepo = mostActiveRepoEntry
    ? mostActiveRepoEntry[0].includes("/")
      ? mostActiveRepoEntry[0].split("/").pop()
      : mostActiveRepoEntry[0]
    : null

  let balanceScore = 100
  if (weekendCommitPct > 30) balanceScore -= Math.min(25, weekendCommitPct - 30)
  if (afterHoursCommitPct > 40) balanceScore -= Math.min(25, afterHoursCommitPct - 40)
  if (lateNightCommitPct > 10) balanceScore -= Math.min(20, (lateNightCommitPct - 10) * 2)
  if (avgCommitsPerDay > 15) balanceScore -= 10
  balanceScore = Math.max(0, Math.min(100, Math.round(balanceScore)))

  const recommendations = []
  if (weekendCommitPct > 30) {
    recommendations.push(`${weekendCommitPct}% of your commits happen on weekends. Try protecting your downtime.`)
  }
  if (lateNightCommitPct > 10) {
    recommendations.push(`${lateNightCommitPct}% of commits are late-night. Consistent sleep improves focus and code quality.`)
  }
  if (afterHoursCommitPct > 50) {
    recommendations.push("More than half your commits happen outside your configured working hours. Consider setting clearer work boundaries.")
  }
  if (avgCommitsPerDay > 15) {
    recommendations.push(`Averaging ${avgCommitsPerDay} commits/day recently. Intense sprints risk burnout. Schedule rest days.`)
  }
  if (streakDays > 20) {
    recommendations.push(`${streakDays}-day activity streak is impressive, but remember to schedule intentional rest days.`)
  }
  if (nightPct > 20) {
    recommendations.push(`${nightPct}% of your coding happens at night. Your peak hour is ${formatHour(peakHour)}, so consider whether that rhythm works for your energy.`)
  }
  if (recommendations.length === 0) {
    recommendations.push("Your recent commit patterns show a relatively balanced coding rhythm.")
    if (morningPct >= 20) {
      recommendations.push(`You do ${morningPct}% of your work in the morning, which may be a useful deep-focus window.`)
    }
    recommendations.push("Keep maintaining boundaries that fit your own schedule and responsibilities.")
  }

  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)
  const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0)

  const langTotal = Object.values(languages).reduce((sum, count) => sum + count, 0)
  const topLangs = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({
      name,
      count,
      pct: langTotal > 0 ? Math.round((count / langTotal) * 100) : 0,
    }))

  const topRepos = [...repos]
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 8)
    .map((repo) => ({
      name: repo.name,
      stars: repo.stargazers_count || 0,
      language: repo.language ?? null,
      forks: repo.forks_count || 0,
    }))

  return {
    languages,
    commitsByHour,
    commitsByDay,
    weeklyActivity,
    topRepos,
    balanceScore,
    recommendations,
    totalCommits,
    streakDays,
    avgCommitsPerDay,
    weekendCommitPct,
    afterHoursCommitPct,
    lateNightCommitPct,
    peakHour,
    peakDay,
    morningPct,
    afternoonPct,
    eveningPct,
    nightPct,
    timeSessions,
    eventTypeBreakdown,
    mostActiveRepo,
    longestStreak,
    totalStars,
    totalForks,
    earlyBirdPct,
    workdayPct,
    topLangs,
    hourlyProductivity,
    analysisConfig: {
      timeZone: settings.timeZone,
      workdayStartHour: settings.workdayStartHour,
      workdayEndHour: settings.workdayEndHour,
      lateNightStartHour: settings.lateNightStartHour,
      lateNightEndHour: settings.lateNightEndHour,
    },
  }
}
