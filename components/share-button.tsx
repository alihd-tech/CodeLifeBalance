"use client"

import { useState } from "react"
import { Check, Download, Link2, Loader2, Share2 } from "lucide-react"
import type { AnalysisData } from "@/lib/github"

interface ShareResponse {
  token: string
  shareUrl: string
  imageUrl: string
  intentUrl: string
}

interface ShareButtonProps {
  data: AnalysisData
}

export function ShareButton({ data }: ShareButtonProps) {
  const [share, setShare] = useState<ShareResponse | null>(null)
  const [pending, setPending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function mint(): Promise<ShareResponse | null> {
    if (share) return share
    setPending(true)
    setError(null)
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          balanceScore: data.balanceScore,
          totalCommits: data.totalCommits,
          streakDays: data.streakDays,
          longestStreak: data.longestStreak,
          peakHour: data.peakHour,
          workdayPct: data.workdayPct,
          nightPct: data.nightPct,
          weekendCommitPct: data.weekendCommitPct,
          totalRepos: data.repos.length,
          topLanguage: data.topLangs[0]?.name,
        }),
      })
      if (!res.ok) throw new Error("Could not create a share link")
      const json = (await res.json()) as ShareResponse
      setShare(json)
      return json
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      return null
    } finally {
      setPending(false)
    }
  }

  // Opened synchronously so the popup blocker treats it as a user gesture,
  // then pointed at the intent URL once the token comes back.
  async function postToX() {
    const win = window.open("", "_blank", "noopener,noreferrer")
    const result = await mint()
    if (!result) {
      win?.close()
      return
    }
    if (win) win.location.href = result.intentUrl
    else window.location.href = result.intentUrl
  }

  async function copyLink() {
    const result = await mint()
    if (!result) return
    await navigator.clipboard.writeText(result.shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function downloadImage() {
    const result = await mint()
    if (!result) return
    const res = await fetch(result.imageUrl)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "code-life-balance.png"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <button
          onClick={downloadImage}
          disabled={pending}
          title="Download the card as a PNG"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Image</span>
        </button>

        <button
          onClick={copyLink}
          disabled={pending}
          title="Copy the public link to this result"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Link2 className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? "Copied" : "Link"}</span>
        </button>

        <button
          onClick={postToX}
          disabled={pending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          Post to X
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
