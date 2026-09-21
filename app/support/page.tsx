import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Support",
  description: "Support and security reporting information for Code Life Balance.",
}

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">
        ← Code Life Balance
      </Link>
      <h1 className="mt-8 text-4xl font-extrabold tracking-tight">Support</h1>
      <p className="mt-5 leading-relaxed text-muted-foreground">
        For usage questions, bug reports, and feature requests, use the Code Life Balance GitHub
        repository. Include the Action version, relevant workflow configuration with secrets
        removed, and the failing step or error message.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <a
          href="https://github.com/alihd-tech/CodeLifeBalance/issues"
          className="rounded-xl border border-border bg-card p-5 hover:border-primary/40"
        >
          <h2 className="font-bold">Issues & feature requests</h2>
          <p className="mt-2 text-sm text-muted-foreground">Open a public GitHub issue for non-sensitive problems.</p>
        </a>
        <a
          href="https://github.com/alihd-tech/CodeLifeBalance/security"
          className="rounded-xl border border-border bg-card p-5 hover:border-primary/40"
        >
          <h2 className="font-bold">Security</h2>
          <p className="mt-2 text-sm text-muted-foreground">Use private vulnerability reporting for credential or data-exposure issues.</p>
        </a>
      </div>

      <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
        Never paste live GitHub tokens, App private keys, client secrets, webhook secrets, session
        cookies, or private repository contents into a public issue.
      </p>
    </main>
  )
}
