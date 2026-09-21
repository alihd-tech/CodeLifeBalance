import type { Metadata } from "next"
import Link from "next/link"
import {
  Activity,
  Building2,
  CheckCircle2,
  GitBranch,
  History,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  Users,
} from "lucide-react"
import { getSession } from "@/lib/session"
import {
  getGitHubAppInstallation,
  isGitHubAppConfigured,
  listInstallationRepositories,
  listOrganizationTeams,
} from "@/lib/github-app"
import {
  isGitHubAppHistoryEnabled,
  readGitHubAppHistory,
} from "@/lib/github-app-history"

export const metadata: Metadata = {
  title: "GitHub App Integration",
  description: "Optional GitHub App connection for realtime and organization-level Code Life Balance features.",
  robots: { index: false, follow: false },
}

export default async function GitHubIntegrationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const session = await getSession()
  const configured = isGitHubAppConfigured()
  const linked = session.githubAppInstallation

  let installation: Awaited<ReturnType<typeof getGitHubAppInstallation>> | null = null
  let repositories: Awaited<ReturnType<typeof listInstallationRepositories>> = []
  let teams: Awaited<ReturnType<typeof listOrganizationTeams>> = []
  let events: Awaited<ReturnType<typeof readGitHubAppHistory>> = []
  let connectionError = false

  if (configured && linked) {
    try {
      installation = await getGitHubAppInstallation(linked.id)
      repositories = await listInstallationRepositories(linked.id)
      events = await readGitHubAppHistory(linked.id, 30)

      if (
        installation.account?.type === "Organization" &&
        installation.account.login
      ) {
        try {
          teams = await listOrganizationTeams(
            linked.id,
            installation.account.login
          )
        } catch {
          teams = []
        }
      }
    } catch {
      connectionError = true
    }
  }

  const account = installation?.account

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-4 w-4" />
            </span>
            Code Life Balance
          </Link>
          <Link
            href="/configure"
            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:border-primary/50 hover:text-primary"
          >
            Action setup
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Optional advanced layer
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            GitHub App integration
          </h1>
          <p className="mt-4 text-muted-foreground">
            Keep the Action or CLI as your default privacy path. Connect the GitHub App only when
            you want installation-scoped repositories, realtime webhooks, organization/team
            discovery, or opt-in history.
          </p>
        </div>

        {params.connected === "1" && (
          <Notice tone="success">GitHub App installation linked successfully.</Notice>
        )}
        {params.disconnected === "1" && (
          <Notice>Local installation link cleared. This does not uninstall the GitHub App on GitHub.</Notice>
        )}
        {params.error && (
          <Notice tone="error">
            The GitHub App connection could not be completed. Review the App callback settings and try again.
          </Notice>
        )}

        {!configured ? (
          <section className="mt-8 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-1 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-bold">GitHub App is not configured on this deployment</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Set the GitHub App ID, client ID, client secret, private key, webhook secret, and
                  app slug. The Action, CLI, configurator, and public viewer continue to work
                  without these values.
                </p>
                <Link
                  href="https://github.com/alihd-tech/CodeLifeBalance/blob/main/docs/github-app.md"
                  className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
                >
                  Open setup guide
                </Link>
              </div>
            </div>
          </section>
        ) : !linked || connectionError ? (
          <section className="mt-8 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold">
              {connectionError ? "Reconnect the installation" : "Connect the optional GitHub App"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              GitHub will show the exact permissions and repositories before installation. The
              authorization callback is used to verify that the installation actually belongs to
              an account you can access.
            </p>
            <a
              href="/api/github-app/install"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              <GitBranch className="h-4 w-4" />
              {connectionError ? "Reconnect GitHub App" : "Install GitHub App"}
            </a>
          </section>
        ) : (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-4">
              <Metric
                icon={account?.type === "Organization" ? Building2 : Users}
                label="Account"
                value={account?.login || linked.accountLogin || "Connected"}
              />
              <Metric
                icon={GitBranch}
                label="Repositories"
                value={String(repositories.length)}
              />
              <Metric
                icon={Users}
                label="Teams visible"
                value={String(teams.length)}
              />
              <Metric
                icon={History}
                label="History"
                value={isGitHubAppHistoryEnabled() ? "Enabled" : "Off"}
              />
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold">Installation repositories</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Access follows the repositories selected during GitHub App installation.
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-2">
                  {repositories.slice(0, 20).map((repository) => (
                    <a
                      key={repository.id}
                      href={repository.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm hover:border-primary/40"
                    >
                      <span className="font-medium">{repository.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {repository.private ? "private" : "public"}
                      </span>
                    </a>
                  ))}
                  {repositories.length === 0 && (
                    <p className="text-sm text-muted-foreground">No repositories are available to this installation.</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-bold">Recent verified events</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Only minimal metadata is persisted, and only when history storage is explicitly configured.
                </p>
                <div className="mt-4 space-y-3">
                  {events.slice(0, 10).map((event) => (
                    <div key={event.deliveryId} className="border-b border-border/60 pb-3 last:border-0">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">
                          {event.event}{event.action ? ` · ${event.action}` : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.receivedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {event.repository && (
                        <p className="mt-1 text-xs text-muted-foreground">{event.repository}</p>
                      )}
                    </div>
                  ))}
                  {events.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {isGitHubAppHistoryEnabled()
                        ? "No stored webhook events yet."
                        : "Persistent webhook history is disabled."}
                    </p>
                  )}
                </div>
              </section>
            </div>

            {account?.type === "Organization" && (
              <section className="mt-6 rounded-2xl border border-border bg-card p-6">
                <h2 className="font-bold">Organization teams</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Requires the optional Members read permission. No team permission means this section remains empty.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {teams.map((team) => (
                    <span key={team.id} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium">
                      {team.name}
                    </span>
                  ))}
                  {teams.length === 0 && (
                    <span className="text-sm text-muted-foreground">No teams available with the current permissions.</span>
                  )}
                </div>
              </section>
            )}

            <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold">Connection controls</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Disconnecting here clears only this browser session's link. Uninstall the App from GitHub settings to revoke the installation.
                </p>
              </div>
              <form action="/api/github-app/disconnect" method="post">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:border-primary/50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Disconnect locally
                </button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function Notice({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode
  tone?: "neutral" | "success" | "error"
}) {
  const className =
    tone === "success"
      ? "border-primary/30 bg-primary/5 text-foreground"
      : tone === "error"
        ? "border-destructive/30 bg-destructive/5 text-foreground"
        : "border-border bg-card text-muted-foreground"

  return <div className={`mt-6 rounded-xl border p-4 text-sm ${className}`}>{children}</div>
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GitBranch
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="mb-3 h-4 w-4 text-primary" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-bold">{value}</p>
    </div>
  )
}
