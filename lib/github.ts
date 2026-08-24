export interface Repo {
  id: number
  name: string
  full_name: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  updated_at: string
  html_url: string
  fork: boolean
  size: number
}

export interface CommitActivity {
  days: number[]
  total: number
  week: number
}

export interface Event {
  id: string
  type: string
  created_at: string
  repo: { name: string }
  payload: {
    commits?: { sha: string; message: string }[]
    size?: number
    action?: string
    ref_type?: string
  }
}

export interface TimeSession {
  label: string
  hours: string
  commits: number
  pct: number
  colorVar: string
}

/** The subset of a GitHub profile the report header needs. */
export interface PublicProfile {
  id: number
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  public_repos: number
  followers: number
  following: number
  created_at: string
  html_url: string
}

export interface AnalysisData {
  repos: Repo[]
  events: Event[]
  /** True when the report was built without a signed-in token. */
  publicOnly: boolean
  languages: Record<string, number>
  commitsByHour: number[]
  commitsByDay: number[]
  weeklyActivity: { week: string; commits: number }[]
  topRepos: { name: string; stars: number; language: string | null; forks: number }[]
  balanceScore: number
  recommendations: string[]
  totalCommits: number
  streakDays: number
  avgCommitsPerDay: number
  weekendCommitPct: number
  afterHoursCommitPct: number
  lateNightCommitPct: number
  // New enriched fields
  peakHour: number
  peakDay: number
  morningPct: number
  afternoonPct: number
  eveningPct: number
  nightPct: number
  timeSessions: TimeSession[]
  eventTypeBreakdown: { type: string; count: number; label: string }[]
  mostActiveRepo: string | null
  longestStreak: number
  totalStars: number
  totalForks: number
  earlyBirdPct: number    // 5am-9am
  workdayPct: number      // 9am-6pm
  topLangs: { name: string; count: number; pct: number }[]
  hourlyProductivity: { hour: number; label: string; commits: number; session: string }[]
}

const BASE = "https://api.github.com"

/** Carries the HTTP status so callers can tell 404 from a rate limit. */
export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly rateLimited = false
  ) {
    super(message)
    this.name = "GitHubError"
  }
}

/**
 * A user token when someone signed in, otherwise the server token if one is
 * configured, otherwise no credentials at all. Anonymous requests only ever
 * reach public data, and are capped at 60/hour for the whole server IP.
 */
function resolveToken(token?: string | null): string | undefined {
  return token || process.env.GITHUB_TOKEN || undefined
}

async function ghFetch<T>(url: string, token?: string | null): Promise<T> {
  const auth = resolveToken(token)
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  if (auth) headers.Authorization = `Bearer ${auth}`

  const res = await fetch(url, { headers, next: { revalidate: 300 } })

  if (!res.ok) {
    const remaining = res.headers.get("x-ratelimit-remaining")
    const rateLimited = (res.status === 403 || res.status === 429) && remaining === "0"
    if (rateLimited) {
      throw new GitHubError(
        "GitHub rate limit reached. Try again shortly, or sign in for a higher limit.",
        res.status,
        true
      )
    }
    if (res.status === 404) {
      throw new GitHubError("That GitHub user could not be found.", 404)
    }
    throw new GitHubError(`GitHub API error: ${res.status}`, res.status)
  }

  return res.json() as Promise<T>
}

/** Public profile for any username, no authorization required. */
export async function fetchProfile(
  username: string,
  token?: string | null
): Promise<PublicProfile> {
  return ghFetch<PublicProfile>(`${BASE}/users/${encodeURIComponent(username)}`, token)
}

export async function fetchUserRepos(
  token: string | null | undefined,
  username: string
): Promise<Repo[]> {
  const repos: Repo[] = []
  let page = 1
  while (page <= 5) {
    // Signed in as this user we can ask for their own repos, which includes
    // private ones. Otherwise fall back to the public listing for the handle.
    const url = token
      ? `${BASE}/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner`
      : `${BASE}/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=updated&type=owner`
    const batch = await ghFetch<Repo[]>(url, token)
    if (!batch.length) break
    repos.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return repos
}

export async function fetchUserEvents(
  token: string | null | undefined,
  username: string
): Promise<Event[]> {
  const events: Event[] = []
  let page = 1
  while (page <= 3) {
    // The public timeline is the same feed minus anything from private repos.
    const path = token ? "events" : "events/public"
    const batch = await ghFetch<Event[]>(
      `${BASE}/users/${encodeURIComponent(username)}/${path}?per_page=100&page=${page}`,
      token
    )
    if (!batch.length) break
    events.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return events
}

function getHourSession(hour: number): string {
  if (hour >= 5 && hour < 9) return "early"
  if (hour >= 9 && hour < 13) return "morning"
  if (hour >= 13 && hour < 18) return "afternoon"
  if (hour >= 18 && hour < 23) return "evening"
  return "night"
}

function formatHour(h: number): string {
  if (h === 0) return "12am"
  if (h < 12) return `${h}am`
  if (h === 12) return "12pm"
  return `${h - 12}pm`
}

function computeAnalysis(
  repos: Repo[],
  events: Event[]
): Omit<AnalysisData, "repos" | "events" | "publicOnly"> {
  // Language aggregation
  const languages: Record<string, number> = {}
  for (const r of repos) {
    if (r.language) {
      languages[r.language] = (languages[r.language] || 0) + 1
    }
  }

  // Parse commit times from push events
  const pushEvents = events.filter((e) => e.type === "PushEvent")
  const commitsByHour = new Array(24).fill(0)
  const commitsByDay = new Array(7).fill(0)
  const weekMap: Record<string, number> = {}
  const repoCommitMap: Record<string, number> = {}

  for (const evt of pushEvents) {
    const date = new Date(evt.created_at)
    const hour = date.getHours()
    const day = date.getDay()
    const commits = evt.payload.size ?? evt.payload.commits?.length ?? 1
    commitsByHour[hour] += commits
    commitsByDay[day] += commits
    repoCommitMap[evt.repo.name] = (repoCommitMap[evt.repo.name] || 0) + commits

    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1))
    weekStart.setHours(0, 0, 0, 0)
    const key = weekStart.toISOString().slice(0, 10)
    weekMap[key] = (weekMap[key] || 0) + commits
  }

  const allWeeks = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-26)
    .map(([week, commits]) => ({ week, commits }))

  const totalCommits = commitsByHour.reduce((a, b) => a + b, 0)

  // Peak hour and day
  const peakHour = commitsByHour.indexOf(Math.max(...commitsByHour))
  const peakDay = commitsByDay.indexOf(Math.max(...commitsByDay))

  // Streak calculation
  const eventDates = new Set(
    events.map((e) => new Date(e.created_at).toISOString().slice(0, 10))
  )
  let streakDays = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (eventDates.has(d.toISOString().slice(0, 10))) {
      streakDays++
    } else {
      break
    }
  }

  // Longest streak
  const allDays = Array.from(eventDates).sort()
  let longestStreak = 0
  let cur = 0
  for (let i = 0; i < allDays.length; i++) {
    if (i === 0) { cur = 1; continue }
    const prev = new Date(allDays[i - 1])
    const curr = new Date(allDays[i])
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    cur = diff === 1 ? cur + 1 : 1
    if (cur > longestStreak) longestStreak = cur
  }
  if (longestStreak === 0 && allDays.length > 0) longestStreak = 1

  // avgCommitsPerDay over last 30 days
  const last30 = new Date()
  last30.setDate(last30.getDate() - 30)
  const recentCommits = pushEvents
    .filter((e) => new Date(e.created_at) >= last30)
    .reduce((sum, e) => sum + (e.payload.size ?? e.payload.commits?.length ?? 1), 0)
  const avgCommitsPerDay = Math.round((recentCommits / 30) * 10) / 10

  // Time session buckets: night(0-4), early(5-8), morning(9-12), afternoon(13-17), evening(18-22), latenight(23)
  const earlyBirdCommits = [5, 6, 7, 8].reduce((s, h) => s + commitsByHour[h], 0)
  const morningCommits = [9, 10, 11, 12].reduce((s, h) => s + commitsByHour[h], 0)
  const afternoonCommits = [13, 14, 15, 16, 17].reduce((s, h) => s + commitsByHour[h], 0)
  const eveningCommits = [18, 19, 20, 21, 22].reduce((s, h) => s + commitsByHour[h], 0)
  const nightCommits = [0, 1, 2, 3, 4, 23].reduce((s, h) => s + commitsByHour[h], 0)

  const safe = (n: number) => totalCommits > 0 ? Math.round((n / totalCommits) * 100) : 0
  const earlyBirdPct = safe(earlyBirdCommits)
  const morningPct = safe(morningCommits)
  const afternoonPct = safe(afternoonCommits)
  const eveningPct = safe(eveningCommits)
  const nightPct = safe(nightCommits)
  const workdayPct = morningPct + afternoonPct

  const timeSessions: TimeSession[] = [
    { label: "Early Bird", hours: "5am–9am", commits: earlyBirdCommits, pct: earlyBirdPct, colorVar: "var(--chart-3)" },
    { label: "Morning", hours: "9am–1pm", commits: morningCommits, pct: morningPct, colorVar: "var(--chart-1)" },
    { label: "Afternoon", hours: "1pm–6pm", commits: afternoonCommits, pct: afternoonPct, colorVar: "var(--chart-2)" },
    { label: "Evening", hours: "6pm–11pm", commits: eveningCommits, pct: eveningPct, colorVar: "var(--chart-5)" },
    { label: "Night Owl", hours: "11pm–5am", commits: nightCommits, pct: nightPct, colorVar: "var(--chart-4)" },
  ]

  // Hourly productivity enriched
  const hourlyProductivity = commitsByHour.map((commits, hour) => ({
    hour,
    label: formatHour(hour),
    commits,
    session: getHourSession(hour),
  }))

  // Weekend / after-hours
  const weekendCommits = commitsByDay[0] + commitsByDay[6]
  const weekendCommitPct = safe(weekendCommits)
  let afterHoursCommits = 0
  let lateNightCommits = 0
  for (let h = 0; h < 24; h++) {
    if (h < 9 || h >= 18) afterHoursCommits += commitsByHour[h]
    if (h >= 23 || h < 4) lateNightCommits += commitsByHour[h]
  }
  const afterHoursCommitPct = safe(afterHoursCommits)
  const lateNightCommitPct = safe(lateNightCommits)

  // Event type breakdown
  const typeCounts: Record<string, number> = {}
  for (const evt of events) {
    typeCounts[evt.type] = (typeCounts[evt.type] || 0) + 1
  }
  const EVENT_LABELS: Record<string, string> = {
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
  const eventTypeBreakdown = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([type, count]) => ({ type, count, label: EVENT_LABELS[type] ?? type.replace("Event", "") }))

  // Most active repo
  const mostActiveRepo = Object.entries(repoCommitMap).sort(([, a], [, b]) => b - a)[0]?.[0]?.split("/")[1] ?? null

  // Balance score
  let score = 100
  if (weekendCommitPct > 30) score -= Math.min(25, weekendCommitPct - 30)
  if (afterHoursCommitPct > 40) score -= Math.min(25, afterHoursCommitPct - 40)
  if (lateNightCommitPct > 10) score -= Math.min(20, (lateNightCommitPct - 10) * 2)
  if (avgCommitsPerDay > 15) score -= 10
  score = Math.max(0, Math.min(100, Math.round(score)))

  const recommendations: string[] = []
  const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  if (weekendCommitPct > 30) {
    recommendations.push(`${weekendCommitPct}% of your commits happen on weekends. Try protecting your downtime.`)
  }
  if (lateNightCommitPct > 10) {
    recommendations.push(`${lateNightCommitPct}% of commits are late-night (11pm–4am). Consistent sleep improves focus and code quality.`)
  }
  if (afterHoursCommitPct > 50) {
    recommendations.push(`More than half your commits happen outside working hours. Consider setting clearer work boundaries.`)
  }
  if (avgCommitsPerDay > 15) {
    recommendations.push(`Averaging ${avgCommitsPerDay} commits/day recently. Intense sprints risk burnout. Schedule rest days.`)
  }
  if (streakDays > 20) {
    recommendations.push(`${streakDays}-day activity streak is impressive, but remember to schedule intentional rest days.`)
  }
  if (nightPct > 20) {
    recommendations.push(`${nightPct}% of your coding happens at night. Your peak hour is ${formatHour(peakHour)}, so consider shifting earlier for better energy.`)
  }
  if (recommendations.length === 0) {
    recommendations.push("Great balance! Your commit patterns suggest healthy coding habits.")
    if (morningPct >= 20) {
      recommendations.push(`You do ${morningPct}% of your work in the morning, a great time for deep focus.`)
    }
    recommendations.push("Keep maintaining clear boundaries between work hours and personal time.")
  }

  // Repo stats
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0)
  const totalForks = repos.reduce((s, r) => s + r.forks_count, 0)

  // Top langs
  const langTotal = Object.values(languages).reduce((a, b) => a + b, 0)
  const topLangs = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({
      name,
      count,
      pct: langTotal > 0 ? Math.round((count / langTotal) * 100) : 0,
    }))

  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 8)
    .map((r) => ({ name: r.name, stars: r.stargazers_count, language: r.language, forks: r.forks_count }))

  return {
    languages,
    commitsByHour,
    commitsByDay,
    weeklyActivity: allWeeks,
    topRepos,
    balanceScore: score,
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
  }
}

/**
 * Builds the full report. Pass a user token to include private activity;
 * pass null to analyze only what the account exposes publicly.
 */
export async function analyzeUser(
  token: string | null | undefined,
  username: string
): Promise<AnalysisData> {
  const [repos, events] = await Promise.all([
    fetchUserRepos(token, username),
    fetchUserEvents(token, username),
  ])
  const analysis = computeAnalysis(repos, events)
  return { repos, events, publicOnly: !token, ...analysis }
}
