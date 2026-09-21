import { computeAnalysis } from "@/packages/core/index.mjs"

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
  earlyBirdPct: number
  workdayPct: number
  topLangs: { name: string; count: number; pct: number }[]
  hourlyProductivity: { hour: number; label: string; commits: number; session: string }[]
  analysisConfig: {
    timeZone: string
    workdayStartHour: number
    workdayEndHour: number
    lateNightStartHour: number
    lateNightEndHour: number
  }
}

const BASE = "https://api.github.com"

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

/**
 * GitHub transport stays in this module. All calculation lives in
 * packages/core so the web app, Action, and future CLI share one engine.
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
  return { repos, events, publicOnly: !token, ...analysis } as AnalysisData
}
