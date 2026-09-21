import test from "node:test"
import assert from "node:assert/strict"
import * as fs from "node:fs"
import * as path from "node:path"
import { tmpdir } from "node:os"
import {
  renderCard,
  renderMarkdown,
  writeReportArtifacts,
} from "./index.mjs"

const analysis = {
  balanceScore: 82,
  totalCommits: 24,
  streakDays: 4,
  longestStreak: 9,
  peakHour: 14,
  weekendCommitPct: 8,
  afterHoursCommitPct: 20,
  lateNightCommitPct: 3,
  commitsByDay: [1, 5, 6, 4, 3, 4, 1],
  topLangs: [
    { name: "TypeScript", count: 5, pct: 71 },
    { name: "Go", count: 2, pct: 29 },
  ],
  recommendations: ["Keep the schedule that works for you."],
}

test("renders detailed and compact SVG cards without external assets", () => {
  const detailed = renderCard("octocat", analysis, {
    theme: "dark",
    cardStyle: "detailed",
  })
  const compact = renderCard("octocat", analysis, {
    theme: "light",
    cardStyle: "compact",
  })

  assert.match(detailed, /width="800"/)
  assert.match(detailed, /privacy-first report/)
  assert.match(compact, /width="620"/)
  assert.match(compact, /local\/private-first/)
  assert.doesNotMatch(detailed, /(?:href|xlink:href|src)=["\']https?:\/\//i)
  assert.doesNotMatch(compact, /(?:href|xlink:href|src)=["\']https?:\/\//i)
})

test("renders a portable Markdown report", () => {
  const markdown = renderMarkdown("octocat", analysis, "2026-09-21T00:00:00.000Z")
  assert.match(markdown, /82\/100/)
  assert.match(markdown, /TypeScript 71%/)
  assert.match(markdown, /without sending your GitHub token/)
})

test("writes only the requested report formats", () => {
  const directory = fs.mkdtempSync(path.join(tmpdir(), "code-life-balance-"))

  try {
    const written = writeReportArtifacts({
      directory,
      username: "octocat",
      profile: {
        login: "octocat",
        name: "The Octocat",
        avatar_url: "https://github.com/images/error/octocat_happy.gif",
        html_url: "https://github.com/octocat",
      },
      analysis,
      formats: ["svg", "json"],
      theme: "dark",
      cardStyle: "detailed",
      generatedAt: "2026-09-21T00:00:00.000Z",
      fs,
      path,
    })

    assert.equal(fs.existsSync(written.svg), true)
    assert.equal(fs.existsSync(written.json), true)
    assert.equal("markdown" in written, false)
    assert.equal(fs.existsSync(path.join(directory, "report.md")), false)

    const data = JSON.parse(fs.readFileSync(written.json, "utf8"))
    assert.equal(data.schemaVersion, 1)
    assert.equal(data.analysis.balanceScore, 82)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})
