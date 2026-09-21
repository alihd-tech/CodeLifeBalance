import test from "node:test"
import assert from "node:assert/strict"
import { computeAnalysis } from "./index.mjs"

const repos = [
  {
    id: 1,
    name: "alpha",
    full_name: "octocat/alpha",
    language: "TypeScript",
    stargazers_count: 3,
    forks_count: 1,
  },
  {
    id: 2,
    name: "beta",
    full_name: "octocat/beta",
    language: "Go",
    stargazers_count: 1,
    forks_count: 0,
  },
]

const events = [
  {
    id: "1",
    type: "PushEvent",
    created_at: "2026-09-21T10:00:00Z",
    repo: { name: "octocat/alpha" },
    payload: { size: 2 },
  },
  {
    id: "2",
    type: "PushEvent",
    created_at: "2026-09-20T18:30:00Z",
    repo: { name: "octocat/beta" },
    payload: { size: 1 },
  },
]

test("computes stable UTC metrics", () => {
  const result = computeAnalysis(repos, events, {
    timeZone: "UTC",
    now: "2026-09-21T12:00:00Z",
  })

  assert.equal(result.totalCommits, 3)
  assert.equal(result.weekendCommitPct, 33)
  assert.equal(result.balanceScore, 97)
  assert.equal(result.totalStars, 4)
  assert.equal(result.totalForks, 1)
  assert.equal(result.analysisConfig.timeZone, "UTC")
})

test("applies the user's timezone before classifying hours and days", () => {
  const utc = computeAnalysis(repos, events, {
    timeZone: "UTC",
    now: "2026-09-21T12:00:00Z",
  })
  const tokyo = computeAnalysis(repos, events, {
    timeZone: "Asia/Tokyo",
    now: "2026-09-21T12:00:00Z",
  })

  assert.equal(utc.weekendCommitPct, 33)
  assert.equal(tokyo.weekendCommitPct, 0)
  assert.notEqual(tokyo.afterHoursCommitPct, utc.afterHoursCommitPct)
})

test("rejects invalid timezones", () => {
  assert.throws(
    () => computeAnalysis(repos, events, { timeZone: "Mars/Olympus" }),
    /Invalid time zone/
  )
})
