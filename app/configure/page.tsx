import type { Metadata } from "next"
import Link from "next/link"
import { Activity, ArrowLeft, ShieldCheck } from "lucide-react"
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
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-4 w-4" />
            </span>
            Code Life Balance
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/integrations/github"
              className="hidden sm:inline-flex rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:border-primary/50 hover:text-primary"
            >
              Advanced GitHub App
            </Link>
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:border-primary/50 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-9 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Zero-provider-access setup
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Build your Code Life Balance workflow
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Choose how you want the report to run. This page generates configuration only.
            Your GitHub token, private activity, and generated report do not need to pass through
            CodeLifeBalance infrastructure.
          </p>
        </div>

        <PrivacyConfigurator />
      </main>
    </div>
  )
}
