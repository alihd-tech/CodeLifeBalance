function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

export function formatHour(hour) {
  if (hour === 0) return "12am"
  if (hour < 12) return `${hour}am`
  if (hour === 12) return "12pm"
  return `${hour - 12}pm`
}

const PALETTES = {
  dark: {
    backgroundA: "#0d1711",
    backgroundB: "#101f16",
    border: "#253c2e",
    foreground: "#f5faf6",
    muted: "#8fa89a",
    subtle: "#759081",
    accent: "#4ade80",
    bar: "#22c55e",
  },
  light: {
    backgroundA: "#f7fbf8",
    backgroundB: "#edf7f0",
    border: "#c8dbce",
    foreground: "#172019",
    muted: "#52685a",
    subtle: "#6c8172",
    accent: "#16803d",
    bar: "#1f9d50",
  },
}

function palette(theme) {
  return PALETTES[theme] || PALETTES.dark
}

export function renderCard(username, analysis, options = {}) {
  const theme = options.theme || "dark"
  const cardStyle = options.cardStyle || "detailed"
  const colors = palette(theme)
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const maxDay = Math.max(...analysis.commitsByDay, 1)

  const width = cardStyle === "compact" ? 620 : 800
  const height = cardStyle === "compact" ? 190 : 240
  const chartStart = cardStyle === "compact" ? 370 : 458
  const chartGap = cardStyle === "compact" ? 30 : 40
  const chartTop = cardStyle === "compact" ? 102 : 123
  const chartBottom = cardStyle === "compact" ? 145 : 177

  const bars = analysis.commitsByDay
    .map((count, index) => {
      const barHeight = Math.max(3, Math.round((count / maxDay) * (chartBottom - chartTop + 10)))
      const x = chartStart + index * chartGap
      const y = chartBottom - barHeight
      return `
        <rect x="${x}" y="${y}" width="18" height="${barHeight}" rx="4" fill="${colors.bar}" opacity="${count ? "0.9" : "0.2"}"/>
        <text x="${x + 9}" y="${chartBottom + 20}" text-anchor="middle" class="tiny">${days[index]}</text>`
    })
    .join("")

  if (cardStyle === "compact") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">Code Life Balance for @${xml(username)}</title>
  <desc id="desc">Balance score ${analysis.balanceScore} out of 100.</desc>
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.backgroundA}"/>
      <stop offset="1" stop-color="${colors.backgroundB}"/>
    </linearGradient>
  </defs>
  <style>
    .title { font: 700 18px ui-sans-serif, system-ui, sans-serif; fill: ${colors.foreground}; }
    .label { font: 500 11px ui-sans-serif, system-ui, sans-serif; fill: ${colors.muted}; }
    .value { font: 700 19px ui-sans-serif, system-ui, sans-serif; fill: ${colors.foreground}; }
    .score { font: 800 42px ui-sans-serif, system-ui, sans-serif; fill: ${colors.accent}; }
    .tiny { font: 500 8px ui-sans-serif, system-ui, sans-serif; fill: ${colors.subtle}; }
  </style>
  <rect width="${width}" height="${height}" rx="18" fill="url(#panel)"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="17" fill="none" stroke="${colors.border}"/>
  <text x="24" y="34" class="title">Code Life Balance</text>
  <text x="24" y="52" class="label">@${xml(username)} · local/private-first</text>
  <text x="24" y="108" class="score">${analysis.balanceScore}</text>
  <text x="82" y="107" class="label">/ 100</text>
  <text x="145" y="91" class="value">${analysis.totalCommits}</text>
  <text x="145" y="108" class="label">commits</text>
  <text x="240" y="91" class="value">${analysis.streakDays}</text>
  <text x="240" y="108" class="label">day streak</text>
  ${bars}
  <text x="24" y="162" class="label">Peak ${formatHour(analysis.peakHour)} · Weekend ${analysis.weekendCommitPct}% · After hours ${analysis.afterHoursCommitPct}%</text>
</svg>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">Code Life Balance for @${xml(username)}</title>
  <desc id="desc">Balance score ${analysis.balanceScore} out of 100, with recent GitHub activity metrics.</desc>
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.backgroundA}"/>
      <stop offset="1" stop-color="${colors.backgroundB}"/>
    </linearGradient>
  </defs>
  <style>
    .title { font: 700 20px ui-sans-serif, system-ui, sans-serif; fill: ${colors.foreground}; }
    .label { font: 500 12px ui-sans-serif, system-ui, sans-serif; fill: ${colors.muted}; }
    .value { font: 700 22px ui-sans-serif, system-ui, sans-serif; fill: ${colors.foreground}; }
    .score { font: 800 50px ui-sans-serif, system-ui, sans-serif; fill: ${colors.accent}; }
    .tiny { font: 500 9px ui-sans-serif, system-ui, sans-serif; fill: ${colors.subtle}; }
  </style>
  <rect width="${width}" height="${height}" rx="20" fill="url(#panel)"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="19" fill="none" stroke="${colors.border}"/>
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
  <text x="${chartStart - 10}" y="92" class="label">ACTIVITY BY DAY</text>
  ${bars}
  <text x="${chartStart - 10}" y="222" class="tiny">Generated locally or inside GitHub Actions · no CodeLifeBalance server required</text>
</svg>`
}

export function renderMarkdown(username, analysis, generatedAt) {
  const topLanguages = analysis.topLangs.length
    ? analysis.topLangs.map((language) => `${language.name} ${language.pct}%`).join(", ")
    : "No language data"

  const recommendations = analysis.recommendations.map((item) => `- ${item}`).join("\n")

  return `# Code Life Balance for @${username}

Generated at ${generatedAt}.

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

> Generated by Code Life Balance without sending your GitHub token or private report to a CodeLifeBalance service.
`
}

export function writeReportArtifacts({
  directory,
  username,
  profile,
  analysis,
  formats = ["svg", "json", "markdown"],
  theme = "dark",
  cardStyle = "detailed",
  generatedAt = new Date().toISOString(),
  fs,
  path,
}) {
  fs.mkdirSync(directory, { recursive: true })
  const written = {}

  if (formats.includes("svg")) {
    const file = path.resolve(directory, "code-life.svg")
    fs.writeFileSync(file, renderCard(username, analysis, { theme, cardStyle }), "utf8")
    written.svg = file
  }

  if (formats.includes("json")) {
    const file = path.resolve(directory, "stats.json")
    fs.writeFileSync(file, JSON.stringify({
      schemaVersion: 1,
      generatedAt,
      username,
      profile: profile ? {
        login: profile.login,
        name: profile.name,
        avatar_url: profile.avatar_url,
        html_url: profile.html_url,
      } : null,
      analysis,
    }, null, 2) + "\n", "utf8")
    written.json = file
  }

  if (formats.includes("markdown")) {
    const file = path.resolve(directory, "report.md")
    fs.writeFileSync(file, renderMarkdown(username, analysis, generatedAt), "utf8")
    written.markdown = file
  }

  return written
}
