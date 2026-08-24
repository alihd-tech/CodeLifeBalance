import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Activity, ExternalLink } from "lucide-react"
import { GitHubLogoIcon } from "@radix-ui/react-icons"
import { DashboardClient } from "@/components/dashboard-client"
import { ThemeToggle } from "@/components/theme-toggle"
import { fetchProfile, GitHubError, type PublicProfile } from "@/lib/github"
import { getSession } from "@/lib/session"

interface Props {
  params: Promise<{ username: string }>
}

async function loadProfile(username: string): Promise<PublicProfile | null> {
  try {
    return await fetchProfile(username)
  } catch (err) {
    // A missing account is a 404; anything else (rate limit, outage) should
    // still render the page so the client can surface the real message.
    if (err instanceof GitHubError && err.status === 404) return null
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return {
    title: `@${username}`,
    description: `Public GitHub activity report for @${username}: commit timing, active hours, languages and a code-life balance score.`,
    // One page per handle would be unbounded crawl space.
    robots: { index: false, follow: true },
  }
}

export default async function PublicReportPage({ params }: Props) {
  const { username } = await params
  const profile = await loadProfile(username)
  if (!profile) notFound()

  const session = await getSession()
  const isOwner = session.user?.login.toLowerCase() === profile.login.toLowerCase()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base text-foreground">Code Life Balance</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href={isOwner ? "/dashboard" : "/api/auth"}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:border-primary/60 hover:text-primary transition-colors"
            >
              <GitHubLogoIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{isOwner ? "My dashboard" : "Sign in"}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile banner */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 p-6 rounded-xl border border-border bg-card">
          {profile.avatar_url && (
            <Image
              src={profile.avatar_url}
              alt={profile.login}
              width={56}
              height={56}
              className="rounded-full ring-2 ring-primary/20"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground truncate">
                {profile.name ?? profile.login}
              </h1>
              <a
                href={profile.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                aria-label={`Open @${profile.login} on GitHub`}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{profile.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground">{profile.public_repos}</strong> public repos
              </span>
              <span>
                <strong className="text-foreground">{profile.followers.toLocaleString()}</strong>{" "}
                followers
              </span>
              <span>
                <strong className="text-foreground">{profile.following}</strong> following
              </span>
              <span className="hidden sm:inline">
                on GitHub since{" "}
                <strong className="text-foreground">
                  {new Date(profile.created_at).getFullYear()}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <DashboardClient username={profile.login} isOwner={isOwner} />
      </main>
    </div>
  )
}
