const DEFAULT_API = "https://api.github.com"

export async function githubFetch(path, token, options = {}) {
  const api = options.apiUrl || process.env.GITHUB_API_URL || DEFAULT_API
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": options.userAgent || "code-life-balance",
  }

  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${api}${path}`, { headers })
  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining")
    const rateLimitHint = remaining === "0" ? " GitHub API rate limit reached." : ""
    throw new Error(`GitHub API request failed with ${response.status} for ${path}.${rateLimitHint}`)
  }

  return response.json()
}

export async function fetchPages(pathFactory, token, maxPages, options = {}) {
  const items = []

  for (let page = 1; page <= maxPages; page++) {
    const batch = await githubFetch(pathFactory(page), token, options)
    if (!Array.isArray(batch) || batch.length === 0) break

    items.push(...batch)
    if (batch.length < 100) break
  }

  return items
}

export async function fetchUserSnapshot({
  username,
  token,
  includePrivate = false,
  apiUrl,
  userAgent,
}) {
  if (!username) throw new Error("username is required")

  const options = { apiUrl, userAgent }

  const repoPath = includePrivate
    ? (page) => `/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner`
    : (page) => `/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=updated&type=owner`

  const eventPath = includePrivate
    ? (page) => `/users/${encodeURIComponent(username)}/events?per_page=100&page=${page}`
    : (page) => `/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`

  const [profile, repos, events] = await Promise.all([
    githubFetch(`/users/${encodeURIComponent(username)}`, token, options),
    fetchPages(repoPath, token, 5, options),
    fetchPages(eventPath, token, 3, options),
  ])

  return { profile, repos, events }
}
