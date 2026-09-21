"use client"

import { useMemo, useState, type ComponentType, type ReactNode } from "react"
import {
  Check,
  Copy,
  GitBranch,
  LockKeyhole,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
  Workflow,
} from "lucide-react"
import {
  defaultPrivacyConfig,
  generateCliCommand,
  generateWorkflow,
  type PrivacyConfig,
  type ReportFormat,
} from "@/lib/privacy-config"

const timeZones = [
  "UTC",
  "Europe/Helsinki",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Tehran",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
]

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"

export function PrivacyConfigurator() {
  const [config, setConfig] = useState<PrivacyConfig>(defaultPrivacyConfig)
  const [copied, setCopied] = useState<"workflow" | "cli" | null>(null)

  const workflow = useMemo(() => generateWorkflow(config), [config])
  const cli = useMemo(() => generateCliCommand(config), [config])

  const update = <K extends keyof PrivacyConfig>(key: K, value: PrivacyConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  const toggleFormat = (format: ReportFormat) => {
    setConfig((current) => {
      const exists = current.formats.includes(format)
      const formats = exists
        ? current.formats.filter((item) => item !== format)
        : [...current.formats, format]

      return { ...current, formats: formats.length ? formats : [format] }
    })
  }

  const copy = async (kind: "workflow" | "cli", value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(kind)
    window.setTimeout(() => setCopied(null), 1600)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Configure your private workflow</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              These settings are used only to generate YAML and a local CLI command in your browser.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="GitHub username" hint="Leave empty to use the repository owner.">
            <input
              value={config.username}
              onChange={(event) => update("username", event.target.value)}
              placeholder="octocat"
              className={fieldClass}
            />
          </Field>

          <Field label="Timezone" hint="Used to classify commit hours correctly.">
            <input
              list="code-life-timezones"
              value={config.timeZone}
              onChange={(event) => update("timeZone", event.target.value)}
              className={fieldClass}
            />
            <datalist id="code-life-timezones">
              {timeZones.map((zone) => (
                <option key={zone} value={zone} />
              ))}
            </datalist>
          </Field>

          <Field label="Workday starts">
            <select
              value={config.workdayStartHour}
              onChange={(event) => update("workdayStartHour", Number(event.target.value))}
              className={fieldClass}
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, "0") + ":00"}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Workday ends">
            <select
              value={config.workdayEndHour}
              onChange={(event) => update("workdayEndHour", Number(event.target.value))}
              className={fieldClass}
            >
              {Array.from({ length: 24 }, (_, index) => index + 1).map((hour) => (
                <option key={hour} value={hour}>
                  {hour === 24 ? "24:00" : String(hour).padStart(2, "0") + ":00"}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Card theme">
            <select
              value={config.theme}
              onChange={(event) => update("theme", event.target.value as PrivacyConfig["theme"])}
              className={fieldClass}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </Field>

          <Field label="Card layout">
            <select
              value={config.cardStyle}
              onChange={(event) =>
                update("cardStyle", event.target.value as PrivacyConfig["cardStyle"])
              }
              className={fieldClass}
            >
              <option value="detailed">Detailed</option>
              <option value="compact">Compact</option>
            </select>
          </Field>

          <Field label="Schedule">
            <select
              value={config.schedule}
              onChange={(event) =>
                update("schedule", event.target.value as PrivacyConfig["schedule"])
              }
              className={fieldClass}
            >
              <option value="manual">Manual only</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom cron</option>
            </select>
          </Field>

          <Field label="Output directory">
            <input
              value={config.outputDir}
              onChange={(event) => update("outputDir", event.target.value)}
              className={fieldClass}
            />
          </Field>

          {config.schedule === "custom" && (
            <div className="sm:col-span-2">
              <Field label="Custom cron" hint="Runs in UTC on GitHub Actions.">
                <input
                  value={config.customCron}
                  onChange={(event) => update("customCron", event.target.value)}
                  className={fieldClass}
                />
              </Field>
            </div>
          )}

          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-semibold">Output formats</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {(["svg", "json", "markdown"] as ReportFormat[]).map((format) => {
                const active = config.formats.includes(format)
                return (
                  <button
                    key={format}
                    type="button"
                    onClick={() => toggleFormat(format)}
                    className={
                      "rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition " +
                      (active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:text-foreground")
                    }
                  >
                    {format === "svg" ? "SVG card" : format === "json" ? "JSON data" : "Markdown"}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:col-span-2">
            <Toggle
              checked={config.commit}
              onChange={(value) => update("commit", value)}
              title="Commit generated files"
              description="Write the report back to this repository. Otherwise the workflow uploads it as a GitHub artifact."
            />
            <Toggle
              checked={config.includePrivate}
              onChange={(value) => update("includePrivate", value)}
              title="Include private repositories"
              description="Uses a user-owned CODE_LIFE_TOKEN secret. The secret remains in GitHub Actions and is never sent to CodeLifeBalance."
              sensitive
            />
          </div>
        </div>

        {config.includePrivate && (
          <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex gap-3">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="text-sm leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Private mode:</strong> create a fine-grained
                GitHub token with only the repositories and read permissions you want, then store it
                as the repository secret <code className="text-primary">CODE_LIFE_TOKEN</code>.
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-6">
        <CodePanel
          icon={Workflow}
          title="GitHub Actions workflow"
          subtitle="Save as .github/workflows/code-life-balance.yml"
          value={workflow}
          copied={copied === "workflow"}
          onCopy={() => copy("workflow", workflow)}
        />

        <CodePanel
          icon={Terminal}
          title="Equivalent local command"
          subtitle="Runs with GITHUB_TOKEN or your existing gh auth session."
          value={cli}
          copied={copied === "cli"}
          onCopy={() => copy("cli", cli)}
          singleLine
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <TrustCard
            icon={ShieldCheck}
            title="No provider token"
            text="The generated workflow does not send credentials to CodeLifeBalance."
          />
          <TrustCard
            icon={GitBranch}
            title="Your artifacts"
            text="SVG, JSON and Markdown stay in your repository or GitHub artifacts."
          />
          <TrustCard
            icon={Terminal}
            title="Local option"
            text="Run the same analytics engine from your own machine."
          />
        </div>
      </section>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

function Toggle({
  checked,
  onChange,
  title,
  description,
  sensitive = false,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  title: string
  description: string
  sensitive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={
        "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition " +
        (checked ? "border-primary/50 bg-primary/5" : "border-border bg-background")
      }
    >
      <span
        className={
          "mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition " +
          (checked ? "bg-primary" : "bg-muted")
        }
      >
        <span
          className={
            "h-4 w-4 rounded-full bg-white transition-transform " +
            (checked ? "translate-x-4" : "translate-x-0")
          }
        />
      </span>
      <span>
        <span className="flex items-center gap-2 text-sm font-semibold">
          {title}
          {sensitive && <LockKeyhole className="h-3.5 w-3.5 text-primary" />}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  )
}

function CodePanel({
  icon: Icon,
  title,
  subtitle,
  value,
  copied,
  onCopy,
  singleLine = false,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  subtitle: string
  value: string
  copied: boolean
  onCopy: () => void
  singleLine?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Icon className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold">{title}</h3>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold hover:border-primary/50 hover:text-primary"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className={
          "overflow-x-auto bg-[oklch(0.08_0.01_155)] p-4 text-xs leading-6 text-[oklch(0.86_0.02_150)] sm:p-5 " +
          (singleLine ? "whitespace-pre" : "max-h-[520px]")
        }
      >
        <code>{value}</code>
      </pre>
    </div>
  )
}

function TrustCard({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  text: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="mb-3 h-4 w-4 text-primary" />
      <h3 className="text-sm font-bold">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  )
}
