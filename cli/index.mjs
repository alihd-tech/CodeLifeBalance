#!/usr/bin/env node

import * as fs from "node:fs"
import * as path from "node:path"
import { execFileSync } from "node:child_process"
import { computeAnalysis } from "../packages/core/index.mjs"
import { githubFetch, fetchUserSnapshot } from "../packages/github-client/index.mjs"
import { writeReportArtifacts } from "../packages/report/index.mjs"

function help() {
  console.log(`Code Life Balance CLI

Privacy-first GitHub activity analysis that runs on your machine.

Usage:
  code-life-balance [options]
  pnpm cli -- [options]

Options:
  --username <login>        GitHub username. Defaults to the authenticated gh user.
  --timezone <IANA>         IANA timezone. Default: UTC
  --workday-start <0-23>    Workday start hour. Default: 9
  --workday-end <1-24>      Workday end hour. Default: 18
  --output-dir <path>       Output directory. Default: ./code-life-balance
  --theme <dark|light>      SVG theme. Default: dark
  --card-style <style>      detailed or compact. Default: detailed
  --formats <list>          svg,json,markdown. Default: all three
  --include-private         Include authenticated private owned repositories/events.
  --public-only             Never use authenticated private activity.
  --no-gh                   Do not read a token from GitHub CLI.
  --help                    Show this help.

Credentials:
  1. GITHUB_TOKEN environment variable, if set.
  2. Otherwise `gh auth token`, unless --no-gh is passed.
  3. Public analysis can run without a token when --username is provided.

No credential or report is sent to CodeLifeBalance infrastructure.
`)
}

function parseArgs(argv) {
  const config = {
    username: "",
    timeZone: "UTC",
    workdayStartHour: 9,
    workdayEndHour: 18,
    outputDir: "code-life-balance",
    theme: "dark",
    cardStyle: "detailed",
    formats: ["svg", "json", "markdown"],
    includePrivate: false,
    noGh: false,
  }

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    const next = () => {
      const value = argv[++index]
      if (!value) throw new Error(`Missing value for ${arg}`)
      return value
    }

    switch (arg) {
      case "--username":
        config.username = next()
        break
      case "--timezone":
        config.timeZone = next()
        break
      case "--workday-start":
        config.workdayStartHour = Number(next())
        break
      case "--workday-end":
        config.workdayEndHour = Number(next())
        break
      case "--output-dir":
        config.outputDir = next()
        break
      case "--theme":
        config.theme = next()
        break
      case "--card-style":
        config.cardStyle = next()
        break
      case "--formats":
        config.formats = next().split(",").map((value) => value.trim().toLowerCase()).filter(Boolean)
        break
      case "--include-private":
        config.includePrivate = true
        break
      case "--public-only":
        config.includePrivate = false
        break
      case "--no-gh":
        config.noGh = true
        break
      case "--help":
      case "-h":
        config.help = true
        break
      default:
        throw new Error(`Unknown option: ${arg}`)
    }
  }

  return config
}

function validate(config) {
  if (!Number.isInteger(config.workdayStartHour) || config.workdayStartHour < 0 || config.workdayStartHour > 23) {
    throw new Error("--workday-start must be an integer from 0 to 23")
  }
  if (!Number.isInteger(config.workdayEndHour) || config.workdayEndHour < 1 || config.workdayEndHour > 24) {
    throw new Error("--workday-end must be an integer from 1 to 24")
  }
  if (!["dark", "light"].includes(config.theme)) {
    throw new Error("--theme must be dark or light")
  }
  if (!["detailed", "compact"].includes(config.cardStyle)) {
    throw new Error("--card-style must be detailed or compact")
  }

  const allowedFormats = new Set(["svg", "json", "markdown"])
  if (config.formats.length === 0) throw new Error("--formats cannot be empty")
  for (const format of config.formats) {
    if (!allowedFormats.has(format)) throw new Error(`Unsupported format: ${format}`)
  }
}

function resolveToken(noGh) {
  if (process.env.GITHUB_TOKEN?.trim()) return process.env.GITHUB_TOKEN.trim()
  if (noGh) return null

  try {
    return execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() || null
  } catch {
    return null
  }
}

async function resolveUsername(username, token) {
  if (username) return username
  if (!token) {
    throw new Error("Provide --username, set GITHUB_TOKEN, or authenticate GitHub CLI with `gh auth login`.")
  }

  const user = await githubFetch("/user", token, { userAgent: "code-life-balance-cli" })
  return user.login
}

async function main() {
  const config = parseArgs(process.argv.slice(2))
  if (config.help) {
    help()
    return
  }

  validate(config)

  const token = resolveToken(config.noGh)
  if (config.includePrivate && !token) {
    throw new Error("--include-private requires GITHUB_TOKEN or an authenticated GitHub CLI session.")
  }

  const username = await resolveUsername(config.username, token)

  console.log(`Code Life Balance · @${username}`)
  console.log(`Mode: ${config.includePrivate ? "authenticated/private-enabled" : "public activity"}`)
  console.log(`Timezone: ${config.timeZone}`)

  const { profile, repos, events } = await fetchUserSnapshot({
    username,
    token,
    includePrivate: config.includePrivate,
    userAgent: "code-life-balance-cli",
  })

  const analysis = computeAnalysis(repos, events, {
    timeZone: config.timeZone,
    workdayStartHour: config.workdayStartHour,
    workdayEndHour: config.workdayEndHour,
  })

  const directory = path.resolve(process.cwd(), config.outputDir)
  const written = writeReportArtifacts({
    directory,
    username,
    profile,
    analysis,
    formats: [...new Set(config.formats)],
    theme: config.theme,
    cardStyle: config.cardStyle,
    fs,
    path,
  })

  console.log("")
  console.log(`Balance score: ${analysis.balanceScore}/100`)
  console.log(`Recent commits: ${analysis.totalCommits}`)
  console.log(`Current streak: ${analysis.streakDays} days`)
  console.log(`Peak coding hour: ${analysis.peakHour}:00`)
  console.log(`Weekend commits: ${analysis.weekendCommitPct}%`)
  console.log("")
  console.log("Generated:")
  for (const file of Object.values(written)) {
    console.log(`  ${path.relative(process.cwd(), file)}`)
  }
}

main().catch((error) => {
  console.error(`Code Life Balance: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
