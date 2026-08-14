"use client"

import { Star, GitFork, ExternalLink, Calendar } from "lucide-react"
import type { Repo } from "@/lib/github"

interface TopReposListProps {
  repos: Repo[]
}

const LANG_DOT: Record<string, string> = {
  TypeScript: "oklch(0.55 0.22 264)",
  JavaScript: "oklch(0.78 0.19 55)",
  Python: "oklch(0.62 0.17 155)",
  Rust: "oklch(0.62 0.18 38)",
  Go: "oklch(0.65 0.17 200)",
  Java: "oklch(0.58 0.18 25)",
  "C++": "oklch(0.58 0.18 310)",
  C: "oklch(0.55 0.10 230)",
  Ruby: "oklch(0.60 0.22 15)",
  PHP: "oklch(0.62 0.13 290)",
  Swift: "oklch(0.68 0.20 40)",
  Kotlin: "oklch(0.58 0.20 280)",
  HTML: "oklch(0.68 0.20 38)",
  CSS: "oklch(0.58 0.20 265)",
  Shell: "oklch(0.60 0.12 140)",
  Vue: "oklch(0.62 0.18 155)",
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function TopReposList({ repos }: TopReposListProps) {
  const sorted = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 8)

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Top Repositories</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Sorted by stars</p>
        </div>
        <div className="text-sm text-muted-foreground font-mono">
          {repos.length} total
        </div>
      </div>

      <div className="space-y-1">
        {sorted.map((repo, i) => (
          <a
            key={repo.id}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-secondary/70 transition-colors"
          >
            {/* Rank */}
            <div className="w-5 flex-shrink-0 text-sm text-muted-foreground font-mono mt-0.5 text-right">
              {i + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {repo.name}
                </span>
                {repo.fork && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border flex-shrink-0 font-medium">
                    fork
                  </span>
                )}
                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-auto" />
              </div>
              {repo.description && (
                <p className="text-sm text-muted-foreground truncate mt-0.5 leading-relaxed">{repo.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5">
                {repo.language && (
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: LANG_DOT[repo.language] ?? "var(--muted-foreground)" }}
                    />
                    <span className="text-xs text-muted-foreground">{repo.language}</span>
                  </div>
                )}
                <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Star className="w-3 h-3" />
                  <span>{repo.stargazers_count.toLocaleString()}</span>
                </div>
                {repo.forks_count > 0 && (
                  <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <GitFork className="w-3 h-3" />
                    <span>{repo.forks_count.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-0.5 text-xs text-muted-foreground ml-auto">
                  <Calendar className="w-3 h-3" />
                  <span>{timeAgo(repo.updated_at)}</span>
                </div>
              </div>
            </div>
          </a>
        ))}
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No repositories found</p>
        )}
      </div>
    </div>
  )
}
