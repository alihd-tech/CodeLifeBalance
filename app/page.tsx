import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { GitHubLogoIcon } from "@radix-ui/react-icons"
import {
  Activity,
  BarChart3,
  Clock,
  Shield,
  Zap,
  TrendingUp,
  GitCommit,
  Code2,
  FlameKindling,
  ArrowRight,
} from "lucide-react"

export default async function HomePage() {
  const session = await getSession()
  if (session.user && session.accessToken) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 backdrop-blur-md bg-background/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
              <Activity className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              Nerd Life Balance
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <span className="text-foreground/40 font-mono text-xs">v2.0</span>
            <span>Features</span>
            <span>How it works</span>
          </nav>
          <Link
            href="/api/auth"
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:border-primary/60 hover:text-primary transition-colors"
          >
            <GitHubLogoIcon className="w-4 h-4" />
            Sign in
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1">
        <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24">

          {/* Subtle radial glow behind hero */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[320px] rounded-full bg-primary/8 blur-[100px]" />
          </div>

          <div className="relative flex flex-col items-center text-center">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/8 text-primary text-xs font-mono font-medium mb-10 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              GitHub Activity Analyzer
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[0.95] text-balance mb-6">
              Know when you
              <br />
              <span className="text-primary">live to code</span>
              <br />
              <span className="text-foreground/40">— and when</span>
              <br />
              <span className="text-foreground/40">{"you don't"}</span>
            </h1>

            {/* Subheading */}
            <p className="text-base md:text-lg text-muted-foreground max-w-lg text-balance leading-relaxed mb-10">
              Connect your GitHub account for an instant deep-dive into your commit patterns,
              active hours, language distribution, and a scored work-life balance report.
            </p>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/api/auth"
                className="group flex items-center gap-2.5 px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-[0_0_24px_-4px_var(--tw-shadow-color)] shadow-primary/40"
              >
                <GitHubLogoIcon className="w-4 h-4" />
                Analyze my GitHub
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <p className="text-xs text-muted-foreground font-mono">
                read-only &middot; no data stored
              </p>
            </div>
          </div>

          {/* ── Mock terminal preview panel ── */}
          <div className="relative mt-16 rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xl shadow-black/30">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/60 bg-background/60">
              <span className="w-3 h-3 rounded-full bg-destructive/70" />
              <span className="w-3 h-3 rounded-full bg-[oklch(0.78_0.19_55)]/70" />
              <span className="w-3 h-3 rounded-full bg-primary/70" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">
                nerd-life-balance — analysis
              </span>
            </div>
            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60">

              {/* Left: mock heatmap */}
              <div className="p-5 col-span-2">
                <p className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-widest">
                  Contribution activity — last 26 weeks
                </p>
                <div className="flex flex-col gap-1">
                  {Array.from({ length: 7 }).map((_, row) => (
                    <div key={row} className="flex gap-1">
                      {Array.from({ length: 26 }).map((_, col) => {
                        const intensity = Math.random()
                        const opacity =
                          intensity < 0.45 ? 0 : intensity < 0.65 ? 0.25 : intensity < 0.82 ? 0.5 : intensity < 0.93 ? 0.75 : 1
                        return (
                          <div
                            key={col}
                            className="flex-1 aspect-square rounded-[2px]"
                            style={{
                              backgroundColor: opacity === 0
                                ? "oklch(1 0 0 / 5%)"
                                : `oklch(0.72 0.18 155 / ${opacity * 100}%)`,
                            }}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
                {/* Mock hourly bars */}
                <p className="font-mono text-xs text-muted-foreground mt-5 mb-2 uppercase tracking-widest">
                  Commit density by hour
                </p>
                <div className="flex items-end gap-0.5 h-10">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const h = [0.5,0.2,0.1,0.05,0.05,0.1,0.3,0.7,1,0.95,0.9,0.85,0.75,0.8,0.9,0.95,0.85,0.7,0.8,0.9,0.75,0.6,0.4,0.3][i]
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t-[1px]"
                        style={{
                          height: `${h * 100}%`,
                          backgroundColor: h > 0.8
                            ? "oklch(0.72 0.18 155)"
                            : h > 0.5
                            ? "oklch(0.72 0.18 155 / 60%)"
                            : "oklch(0.72 0.18 155 / 25%)",
                        }}
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-mono text-[10px] text-muted-foreground/50">12am</span>
                  <span className="font-mono text-[10px] text-muted-foreground/50">6am</span>
                  <span className="font-mono text-[10px] text-muted-foreground/50">12pm</span>
                  <span className="font-mono text-[10px] text-muted-foreground/50">6pm</span>
                  <span className="font-mono text-[10px] text-muted-foreground/50">11pm</span>
                </div>
              </div>

              {/* Right: mock stat callouts */}
              <div className="p-5 flex flex-col gap-4">
                <StatBlock label="Balance Score" value="74" unit="/100" accent />
                <StatBlock label="Peak Hour" value="10pm" unit="" />
                <StatBlock label="Longest Streak" value="21" unit="days" />
                <StatBlock label="After-Hours" value="38" unit="%" warn />
                <StatBlock label="Repos Analyzed" value="42" unit="" />
                <div className="mt-auto pt-3 border-t border-border/60">
                  <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                    <span className="text-primary">{">"}</span> 3 recommendations generated<br />
                    <span className="text-primary">{">"}</span> Top lang: TypeScript (61%)<br />
                    <span className="text-primary">{">"}</span> Most active: Saturday
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="flex items-center gap-3 mb-8">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              What{"'"}s inside
            </span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                icon: BarChart3,
                title: "Activity Heatmap",
                desc: "52-week contribution calendar with monthly trend overlay and streak tracking.",
                tag: "visual",
              },
              {
                icon: Clock,
                title: "Active Hours Deep Dive",
                desc: "24-hour clock ring, session buckets (morning / afternoon / evening / night owl), and day-of-week intensity.",
                tag: "insight",
              },
              {
                icon: TrendingUp,
                title: "Balance Score",
                desc: "A 0–100 score with arc gauge, metric tiles, and personalized recommendations.",
                tag: "report",
              },
              {
                icon: Code2,
                title: "Language Breakdown",
                desc: "Donut chart and ranked bar chart for all languages across your repositories.",
                tag: "visual",
              },
              {
                icon: GitCommit,
                title: "Commit Timing Matrix",
                desc: "Day × time-block heatmap showing exactly when your productivity peaks each week.",
                tag: "insight",
              },
              {
                icon: FlameKindling,
                title: "Event Breakdown",
                desc: "Push, PR, issue, and comment activity charted over your recent history.",
                tag: "data",
              },
              {
                icon: Shield,
                title: "Private & Secure",
                desc: "Data is fetched live and never stored. Your token lives only in an encrypted session cookie.",
                tag: "security",
              },
              {
                icon: Zap,
                title: "Instant Results",
                desc: "Analysis runs in seconds by pulling your latest events and repository metadata.",
                tag: "perf",
              },
              {
                icon: Activity,
                title: "Top Repositories",
                desc: "Stars, forks, and language for your most popular repos ranked at a glance.",
                tag: "data",
              },
            ].map(({ icon: Icon, title, desc, tag }) => (
              <div
                key={title}
                className="group relative p-5 rounded-lg border border-border/70 bg-card hover:border-primary/40 hover:bg-primary/[0.03] transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" strokeWidth={1.75} />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest border border-border/50 rounded px-1.5 py-0.5">
                    {tag}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="border-t border-border/60 bg-card/40">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="flex items-center gap-3 mb-12">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                How it works
              </span>
              <div className="flex-1 h-px bg-border/60" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Sign in with GitHub", desc: "OAuth read-only login. We request only the minimum scopes needed to analyze your public activity." },
                { step: "02", title: "We pull your data", desc: "Up to 500 repos and 300 recent events are fetched live from the GitHub REST API in seconds." },
                { step: "03", title: "Review your insights", desc: "An interactive dashboard with 8+ charts, a balance score, and personalized recommendations." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <span className="font-mono text-4xl font-extrabold text-primary/20 leading-none shrink-0 select-none">
                    {step}
                  </span>
                  <div>
                    <h3 className="font-bold text-foreground mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-center text-center">
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-4">
            Ready?
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-balance mb-6">
            See your coding habits<br />in a new light
          </h2>
          <Link
            href="/api/auth"
            className="group flex items-center gap-2.5 px-7 py-3.5 rounded-md bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all shadow-[0_0_32px_-6px_var(--tw-shadow-color)] shadow-primary/50"
          >
            <GitHubLogoIcon className="w-4 h-4" />
            Get started free
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60 px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/80 flex items-center justify-center">
              <Activity className="w-3 h-3 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm text-foreground">Nerd Life Balance</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            GitHub REST API &middot; Read-only OAuth &middot; No data stored
          </p>
        </div>
      </footer>

    </div>
  )
}

function StatBlock({
  label,
  value,
  unit,
  accent,
  warn,
}: {
  label: string
  value: string
  unit: string
  accent?: boolean
  warn?: boolean
}) {
  return (
    <div>
      <p className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className={`font-mono font-bold text-xl leading-none ${accent ? "text-primary" : warn ? "text-[oklch(0.78_0.19_55)]" : "text-foreground"}`}>
        {value}
        <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
      </p>
    </div>
  )
}
