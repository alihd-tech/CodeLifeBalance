import * as fs from "node:fs"
import * as path from "node:path"
import { execFileSync } from "node:child_process"
import { computeAnalysis } from "../packages/core/index.mjs"
import { fetchUserSnapshot } from "../packages/github-client/index.mjs"
import { writeReportArtifacts } from "../packages/report/index.mjs"

function input(name) {
  return (process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "").trim()
}

function boolInput(name) {
  return input(name).toLowerCase() === "true"
}

function intInput(name, fallback) {
  const raw = input(name)
  if (!raw) return fallback
  const value = Number(raw)
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`)
  return value
}

function listInput(name, fallback) {
  const raw = input(name)
  const values = (raw || fallback)
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  const allowed = new Set(["svg", "json", "markdown"])
  for (const value of values) {
    if (!allowed.has(value)) throw new Error(`Unsupported format: ${value}`)
  }

  return [...new Set(values)]
}

function setOutput(name, value = "") {
  if (!process.env.GITHUB_OUTPUT) return
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`)
}

function addSummary(markdown) {
  if (!process.env.GITHUB_STEP_SUMMARY) return
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`)
}

function safeOutputDirectory(requested) {
  const workspace = path.resolve(process.env.GITHUB_WORKSPACE || process.cwd())
  const target = path.resolve(workspace, requested || "code-life-balance")

  if (target !== workspace && !target.startsWith(`${workspace}${path.sep}`)) {
    throw new Error("output-dir must stay inside GITHUB_WORKSPACE")
  }

  return { workspace, target }
}

function maybeCommit(outputDir) {
  if (!boolInput("commit")) return false

  execFileSync("git", ["config", "user.name", "github-actions[bot]"], { stdio: "inherit" })
  execFileSync("git", ["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"], { stdio: "inherit" })
  execFileSync("git", ["add", outputDir], { stdio: "inherit" })

  const status = execFileSync("git", ["status", "--porcelain", "--", outputDir], {
    encoding: "utf8",
  }).trim()

  if (!status) return false

  execFileSync("git", ["commit", "-m", "chore: update Code Life Balance report"], {
    stdio: "inherit",
  })
  execFileSync("git", ["push"], { stdio: "inherit" })
  return true
}

async function main() {
  const token = input("github-token")
  if (!token) {
    throw new Error("github-token is required. Pass ${{ secrets.GITHUB_TOKEN }} or a user-owned token.")
  }

  const username = input("username") || process.env.GITHUB_ACTOR
  if (!username) throw new Error("username could not be determined")

  const includePrivate = boolInput("include-private")
  const timeZone = input("timezone") || "UTC"
  const workdayStartHour = intInput("workday-start", 9)
  const workdayEndHour = intInput("workday-end", 18)
  const theme = input("theme") || "dark"
  const cardStyle = input("card-style") || "detailed"
  const formats = listInput("formats", "svg,json,markdown")

  if (!["dark", "light"].includes(theme)) {
    throw new Error("theme must be dark or light")
  }
  if (!["detailed", "compact"].includes(cardStyle)) {
    throw new Error("card-style must be detailed or compact")
  }

  const outputDirInput = input("output-dir") || "code-life-balance"
  const { workspace, target } = safeOutputDirectory(outputDirInput)

  const { profile, repos, events } = await fetchUserSnapshot({
    username,
    token,
    includePrivate,
    userAgent: "code-life-balance-action",
  })

  const analysis = computeAnalysis(repos, events, {
    timeZone,
    workdayStartHour,
    workdayEndHour,
  })

  const written = writeReportArtifacts({
    directory: target,
    username,
    profile,
    analysis,
    formats,
    theme,
    cardStyle,
    fs,
    path,
  })

  const relativeOutput = path.relative(workspace, target) || "."
  const relativeWritten = Object.fromEntries(
    Object.entries(written).map(([format, file]) => [format, path.relative(workspace, file)])
  )

  const committed = maybeCommit(relativeOutput)

  setOutput("score", analysis.balanceScore)
  setOutput("svg-path", relativeWritten.svg || "")
  setOutput("json-path", relativeWritten.json || "")
  setOutput("markdown-path", relativeWritten.markdown || "")

  addSummary(`## Code Life Balance

**@${username}** scored **${analysis.balanceScore}/100**.

- Recent commits: ${analysis.totalCommits}
- Current streak: ${analysis.streakDays} days
- Weekend commits: ${analysis.weekendCommitPct}%
- Timezone: ${timeZone}
- Workday: ${workdayStartHour}:00-${workdayEndHour}:00
- Generated formats: ${formats.join(", ")}
- Committed: ${committed ? "yes" : "no"}

Your GitHub token stayed inside this workflow runner and was used only for GitHub API requests.`)
}

main().catch((error) => {
  console.error(`::error::${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
