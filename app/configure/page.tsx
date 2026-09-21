import type { Metadata } from "next"
import Link from "next/link"
import {
  Activity,
  ArrowLeft,
  Boxes,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { PrivacyConfigurator } from "@/components/privacy-configurator"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: "Configure Privacy-First GitHub Reports",
  description:
    "Generate a GitHub Actions workflow or local CLI command for Code Life Balance without giving CodeLifeBalance your GitHub credentials.",
}

export default function ConfigurePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-3 px-3 sm:px-5 lg:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Activity className="h-4 w-4" />
            </span>
            <span className="truncate text-sm font-bold tracking-tight sm:text-base">
              Code Life Balance
            </span>
            <span className="hidden rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:inline-flex">
              Configurator
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            <Link
              href="/integrations/github"
              className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground md:flex"
            >
              <Boxes className="h-3.5 w-3.5" />
              GitHub App
            </Link>
            <ThemeToggle />
            <Link
              href="/"
              aria-label="Back to home"
              className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground sm:px-3"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-3 py-5 sm:px-5 sm:py-7 lg:px-6">
        <section className="mb-5 grid gap-4 rounded-2xl border border-border/80 bg-card/70 p-4 shadow-sm sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-2.5 py-1 text-[11px] font-bold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Privacy-first setup
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Live YAML + CLI
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Configure once. Run where you trust.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Tune the report, copy the generated workflow, and keep credentials inside GitHub
              Actions or your local machine. Nothing on this page asks for your token.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:min-w-[330px]">
            {[
              ["Token", "Stays with you"],
              ["Output", "SVG · JSON · MD"],
              ["Setup", "No account"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border/80 bg-background/70 px-3 py-2.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 truncate text-xs font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <PrivacyConfigurator />
      </main>
    </div>
  )
}
