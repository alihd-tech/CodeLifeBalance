import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy model for Code Life Balance Action, CLI, public viewer, hosted dashboard, and optional GitHub App.",
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">
        ← Code Life Balance
      </Link>
      <h1 className="mt-8 text-4xl font-extrabold tracking-tight">Privacy</h1>
      <p className="mt-5 leading-relaxed text-muted-foreground">
        Code Life Balance is designed so the recommended GitHub Action and local CLI can analyze
        GitHub activity without sending your GitHub credential or generated private report to a
        Code Life Balance service.
      </p>

      <div className="mt-10 space-y-8">
        <Section title="GitHub Action">
          The Action runs inside your GitHub Actions runner. The token you pass is used for GitHub
          API requests from that runner. Generated SVG, JSON, and Markdown files remain in the
          workflow workspace, repository, or GitHub artifact storage according to your workflow.
        </Section>
        <Section title="Local CLI">
          The CLI runs on your machine and can use GITHUB_TOKEN or your existing GitHub CLI
          authentication. It does not require a Code Life Balance account.
        </Section>
        <Section title="Public viewer">
          Public username reports use public GitHub information. No GitHub authorization is
          required from the visitor.
        </Section>
        <Section title="Optional GitHub App">
          The GitHub App is an advanced hosted mode. Installation credentials are created
          server-side only when needed and are not stored as long-lived installation tokens.
          Webhook requests are signature-verified. Persistent webhook history is off by default and
          stores only minimal event metadata when explicitly configured by the deployment owner.
        </Section>
        <Section title="Legacy hosted dashboard">
          The legacy OAuth dashboard remains during migration. In this mode a GitHub access token
          is stored in an encrypted, HTTP-only session cookie for the session lifetime. This is not
          the recommended zero-provider-access mode.
        </Section>
        <Section title="Analytics">
          The production website may load Vercel Analytics. The Action and CLI do not call Vercel
          Analytics and do not need the hosted website to operate.
        </Section>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 leading-relaxed text-muted-foreground">{children}</p>
    </section>
  )
}
