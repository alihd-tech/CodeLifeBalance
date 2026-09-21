import { appendFileSync, mkdirSync, writeFileSync } from "node:fs"
import { resolve, relative, sep } from "node:path"
import { execFileSync } from "node:child_process"
import { computeAnalysis } from "../packages/core/index.mjs"

const API = process.env.GITHUB_API_URL || "https://api.github.com"

function input(name) {
  return (process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "").trim()
}

function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`)
}

function addSummary(markdown) {
  if (!process.env.GITHUB_STEP_SUMMARY) return
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`)
}

async function githubFetch(path, token) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "code-life-balance-action",
    },
  })

  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining")
    const hint = remaining === "0" ? " GitHub API rate limit reached." : ""
    throw new Error(`GitHub API request failed with ${response.status}.${hint}`)
  }

  return response.json()
}

async function fetchPages(pathFactory, token, maxPages) {
  const items = []
  for (let page = 1; page <= maxPages; page++) {
    const batch = await githubFetch(pathFactory(page), token)
    if (!Array.isArray(batch) || batch.length === 0) break
    items.push(...batch)
    if (batch.length < 100) break
  }
  return items
}

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function formatHour(hour) {
  if (hour === 0) return "12am"
  if (hour < 12) return `${hour}am`
  if (hour === 12) return "12pm"
  return `${hour - 12}pm`
}

function renderCard(username, analysis) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const maxDay = Math.max(...analysis.commitsByDay, 1)
  const bars = analysis.commitsByDay
    .map((count, index) => {
      const height = Math.max(3, Math.round((count / maxDay) * 54))
      const x = 458 + index * 40
      const y = 177 - height
      return `
        <rect x="${x}" y="${y}" width="22" height="${height}" rx="5" fill="#22c55e" opacity="${count ? "0.9" : "0.2"}"/>
        <text x="${x + 11}" y="198" text-anchor="middle" class="tiny">${days[index]}</text>`
    })
    .join("")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="240" viewBox="0 0 800 240" role="img" aria-labelledby="title desc">
  <title id="title">Code Life Balance for @${xml(username)}</title>
  <desc id="desc">Balance score ${analysis.balanceScore} out of 100, with recent GitHub activity metrics.</desc>
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d1711"/>
      <stop offset="1" stop-color="#101f16"/>
    </linearGradient>
  </defs>
  <style>
    .title { font: 700 20px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #f5faf6; }
    .label { font: 500 12px ui-sans-serif, system-ui, sans-serif; fill: #8fa89a; }
    .value { font: 700 22px ui-sans-serif, system-ui, sans-serif; fill: #f5faf6; }
    .score { font: 800 50px ui-sans-serif, system-ui, sans-serif; fill: #4ade80; }
    .tiny { font: 500 9px ui-sans-serif, system-ui, sans-serif; fill: #759081; }
  </style>
  <rect width="800" height="240" rx="20" fill="url(#panel)"/>
  <rect x="1" y="1" width="798" height="238" rx="19" fill="none" stroke="#253c2e"/>

  <text x="28" y="38" class="title">Code Life Balance</text>
  <text x="28" y="59" class="label">@${xml(username)} · privacy-first report</text>

  <text x="28" y="115" class="score">${analysis.balanceScore}</text>
  <text x="96" y="114" class="label">/ 100</text>
  <text x="28" y="138" class="label">balance score</text>

  <text x="180" y="100" class="value">${analysis.totalCommits}</text>
  <text x="180" y="120" class="label">recent commits</text>

  <text x="300" y="100" class="value">${analysis.streakDays}</text>
  <text x="300" y="120" class="label">day streak</text>

  <text x="180" y="162" class="value">${formatHour(analysis.peakHour)}</text>
  <text x="180" y="182" class="label">peak coding hour</text>

  <text x="300" y="162" class="value">${analysis.weekendCommitPct}%</text>
  <text x="300" y="182" class="label">weekend commits</text>

  <text x="448" y="92" class="label">ACTIVITY BY DAY</text>
  ${bars}

  <text x="448" y="222" class="tiny">Generated inside the repository's GitHub Actions runner · no CodeLifeBalance server required</text>
</svg>`
}

function renderMarkdown(username, analysis, generatedAt) {
  const topLanguages = analysis.topLangs.length
    ? analysis.topLangs.map((language) => `${language.name} ${language.pct}%`).join(", ")
    : "No language data"

  const recommendations = analysis.recommendations.map((item) => `- ${item}`).join("\n")

  return `# Code Life Balance for @${username}

Generated at ${generatedAt} using the privacy-first GitHub Action.

| Metric | Value |
| --- | ---: |
| Balance score | **${analysis.balanceScore}/100** |
| Recent commits | ${analysis.totalCommits} |
| Current streak | ${analysis.streakDays} days |
| Longest streak | ${analysis.longestStreak} days |
| Peak coding hour | ${formatHour(analysis.peakHour)} |
| Weekend commits | ${analysis.weekendCommitPct}% |
| After-hours commits | ${analysis.afterHoursCommitPct}% |
| Late-night commits | ${analysis.lateNightCommitPct}% |
| Top languages | ${topLanguages} |

## Notes

${recommendations}

> The Action reads GitHub data from inside your runner and writes the generated artifacts into your own workspace. The CodeLifeBalance Action does not send your token or report to a CodeLifeBalance service.
`
}

function safeOutputDirectory(requested) {
  const workspace = resolve(process.env.GITHUB_WORKSPACE || process.cwd())
  const target = resolve(workspace, requested || "code-life-balance")
  if (target !== workspace && !target.startsWith(`${workspace}${sep}`)) {
    throw new Error("output-dir must stay inside GITHUB_WORKSPACE")
  }
  return { workspace, target }
}

function maybeCommit(outputDir) {
  if (input("commit").toLowerCase() !== "true") return false

  execFileSync("git", ["config", "user.name", "github-actions[bot]"], { stdio: "inherit" })
  execFileSync("git", ["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"], { stdio: "inherit" })
  execFileSync("git", ["add", outputDir], { stdio: "inherit" })

  const status = execFileSync("git", ["status", "--porcelain", "--", outputDir], { encoding: "utf8" }).trim()
  if (!status) return false

  execFileSync("git", ["commit", "-m", "chore: update Code Life Balance report"], { stdio: "inherit" })
  execFileSync("git", ["push"], { stdio: "inherit" })
  return true
}

async function main() {
  const token = input("github-token")
  if (!token) {
    throw new Error("github-token is required. Pass ${{ secrets.GITHUB_TOKEN }} from your workflow.")
  }

  const username = input("username") || process.env.GITHUB_ACTOR
  if (!username) throw new Error("username could not be determined")

  const timeZone = input("timezone") || "UTC"
  const outputDirInput = input("output-dir") || "code-life-balance"
  const { workspace, target } = safeOutputDirectory(outputDirInput)

  const [profile, repos, events] = await Promise.all([
    githubFetch(`/users/${encodeURIComponent(username)}`, token),
    fetchPages(
      (page) => `/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=updated&type=owner`,
      token,
      5
    ),
    fetchPages(
      (page) => `/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`,
      token,
      3
    ),
  ])

  const analysis = computeAnalysis(repos, events, { timeZone })
  const generatedAt = new Date().toISOString()

  mkdirSync(target, { recursive: true })

  const svgPath = resolve(target, "code-life.svg")
  const jsonPath = resolve(target, "stats.json")
  const markdownPath = resolve(target, "report.md")

  writeFileSync(svgPath, renderCard(username, analysis), "utf8")
  writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        schemaVersion: 1,
        generatedAt,
        username,
        profile: {
          login: profile.login,
          name: profile.name,
          avatar_url: profile.avatar_url,
          html_url: profile.html_url,
        },
        analysis,
      },
      null,
      2
    ) + "\n",
    "utf8"
  )
  writeFileSync(markdownPath, renderMarkdown(username, analysis, generatedAt), "utf8")

  const relativeOutput = relative(workspace, target) || "."
  const relativeSvg = relative(workspace, svgPath)
  const relativeJson = relative(workspace, jsonPath)
  const relativeMarkdown = relative(workspace, markdownPath)

  const committed = maybeCommit(relativeOutput)

  setOutput("score", analysis.balanceScore)
  setOutput("svg-path", relativeSvg)
  setOutput("json-path", relativeJson)
  setOutput("markdown-path", relativeMarkdown)

  addSummary(`## Code Life Balance

**@${username}** scored **${analysis.balanceScore}/100**.

- Recent commits: ${analysis.totalCommits}
- Current streak: ${analysis.streakDays} days
- Weekend commits: ${analysis.weekendCommitPct}%
- Generated: \`${relativeSvg}\`
- Committed: ${committed ? "yes" : "no"}

Your GitHub token stayed inside this workflow runner and was used only for GitHub API requests.`)
}

main().catch((error) => {
  console.error(`::error::${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
