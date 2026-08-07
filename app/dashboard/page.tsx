import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getSession } from "@/lib/session"
import { DashboardClient } from "@/components/dashboard-client"
import { Activity, ExternalLink, LogOut } from "lucide-react"
import { GitHubLogoIcon } from "@radix-ui/react-icons"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session.user || !session.accessToken) {
    redirect("/")
  }

  const user = session.user

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Nerd Life Balance</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {user.avatar_url && (
                <Image
                  src={user.avatar_url}
                  alt={user.login}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              )}
              <span className="font-medium hidden sm:inline">{user.name ?? user.login}</span>
              <ExternalLink className="w-3.5 h-3.5 hidden sm:block" />
            </a>
            <Link
              href="/api/auth/logout"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Profile banner */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 p-4 rounded-xl border border-border bg-card">
          {user.avatar_url && (
            <Image
              src={user.avatar_url}
              alt={user.login}
              width={56}
              height={56}
              className="rounded-full ring-2 ring-primary/20"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground truncate">
                {user.name ?? user.login}
              </h1>
              <a
                href={user.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
              >
                <GitHubLogoIcon className="w-4 h-4" />
              </a>
            </div>
            {user.bio && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{user.bio}</p>
            )}
            <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">{user.public_repos}</strong> repos
              </span>
              <span>
                <strong className="text-foreground">{user.followers.toLocaleString()}</strong> followers
              </span>
              <span>
                <strong className="text-foreground">{user.following}</strong> following
              </span>
              <span className="hidden sm:inline">
                on GitHub since{" "}
                <strong className="text-foreground">
                  {new Date(user.created_at).getFullYear()}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <DashboardClient />
      </main>
    </div>
  )
}
