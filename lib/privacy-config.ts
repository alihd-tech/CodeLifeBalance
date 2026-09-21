export type ReportFormat = "svg" | "json" | "markdown"
export type ReportTheme = "dark" | "light"
export type CardStyle = "detailed" | "compact"
export type SchedulePreset = "manual" | "daily" | "weekly" | "monthly" | "custom"

export interface PrivacyConfig {
  username: string
  timeZone: string
  workdayStartHour: number
  workdayEndHour: number
  theme: ReportTheme
  cardStyle: CardStyle
  formats: ReportFormat[]
  outputDir: string
  schedule: SchedulePreset
  customCron: string
  commit: boolean
  includePrivate: boolean
}

export const defaultPrivacyConfig: PrivacyConfig = {
  username: "",
  timeZone: "UTC",
  workdayStartHour: 9,
  workdayEndHour: 18,
  theme: "dark",
  cardStyle: "detailed",
  formats: ["svg", "json", "markdown"],
  outputDir: "code-life-balance",
  schedule: "weekly",
  customCron: "17 3 * * 1",
  commit: true,
  includePrivate: false,
}

function quoted(value: string) {
  return JSON.stringify(value)
}

function cronFor(config: PrivacyConfig) {
  switch (config.schedule) {
    case "daily":
      return "17 3 * * *"
    case "weekly":
      return "17 3 * * 1"
    case "monthly":
      return "17 3 1 * *"
    case "custom":
      return config.customCron.trim() || "17 3 * * 1"
    default:
      return null
  }
}

function workflowExpression(value: string) {
  return "$" + "{{ " + value + " }}"
}

export function generateWorkflow(config: PrivacyConfig) {
  const cron = cronFor(config)
  const permissions = config.commit ? "write" : "read"
  const token = config.includePrivate
    ? workflowExpression("secrets.CODE_LIFE_TOKEN")
    : workflowExpression("secrets.GITHUB_TOKEN")
  const username = config.username.trim() || workflowExpression("github.repository_owner")
  const formats = config.formats.length ? config.formats.join(",") : "svg"

  const triggers = cron
    ? `on:
  workflow_dispatch:
  schedule:
    - cron: ${quoted(cron)}`
    : `on:
  workflow_dispatch:`

  const upload = config.commit
    ? ""
    : `

      - name: Upload generated report
        uses: actions/upload-artifact@v4
        with:
          name: code-life-balance-report
          path: ${quoted(config.outputDir)}`

  return `name: Code Life Balance

${triggers}

permissions:
  contents: ${permissions}

jobs:
  report:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Generate Code Life Balance report
        uses: alihd-tech/CodeLifeBalance@v1
        with:
          github-token: ${token}
          username: ${quoted(username)}
          include-private: ${quoted(String(config.includePrivate))}
          timezone: ${quoted(config.timeZone)}
          workday-start: ${quoted(String(config.workdayStartHour))}
          workday-end: ${quoted(String(config.workdayEndHour))}
          theme: ${quoted(config.theme)}
          card-style: ${quoted(config.cardStyle)}
          formats: ${quoted(formats)}
          output-dir: ${quoted(config.outputDir)}
          commit: ${quoted(String(config.commit))}${upload}
`
}

export function generateCliCommand(config: PrivacyConfig) {
  const args = [
    "pnpm cli --",
    config.username.trim() ? `--username ${shellQuote(config.username.trim())}` : "",
    `--timezone ${shellQuote(config.timeZone)}`,
    `--workday-start ${config.workdayStartHour}`,
    `--workday-end ${config.workdayEndHour}`,
    `--output-dir ${shellQuote(config.outputDir)}`,
    `--theme ${config.theme}`,
    `--card-style ${config.cardStyle}`,
    `--formats ${config.formats.join(",") || "svg"}`,
    config.includePrivate ? "--include-private" : "--public-only",
  ].filter(Boolean)

  return args.join(" ")
}

function shellQuote(value: string) {
  if (/^[a-zA-Z0-9_./:@+-]+$/.test(value)) return value
  return "'" + value.replaceAll("'", "'\\''") + "'"
}
