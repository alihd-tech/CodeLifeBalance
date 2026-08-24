"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { ArrowRight, Loader2 } from "lucide-react"

const USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/

interface UsernameFormProps {
  className?: string
  autoFocus?: boolean
}

/** Takes a GitHub handle and opens its public report. No authorization involved. */
export function UsernameForm({ className = "", autoFocus = false }: UsernameFormProps) {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    // Accept a bare handle, an @handle, or a pasted profile URL.
    const handle = value
      .trim()
      .replace(/^@/, "")
      .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
      .replace(/\/.*$/, "")

    if (!USERNAME_RE.test(handle)) {
      setError("Enter a valid GitHub username.")
      return
    }
    setError(null)
    setPending(true)
    router.push(`/u/${handle}`)
  }

  return (
    <form onSubmit={onSubmit} className={`w-full max-w-md ${className}`}>
      <div className="flex items-center gap-2 p-1.5 rounded-xl border border-border bg-card focus-within:border-primary/60 transition-colors">
        <span className="pl-3 text-muted-foreground select-none">github.com/</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus={autoFocus}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          aria-label="GitHub username"
          placeholder="username"
          className="flex-1 min-w-0 bg-transparent py-2 text-foreground placeholder:text-muted-foreground outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 shrink-0"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Analyze
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          No sign-in, no permissions. Public activity only.
        </p>
      )}
    </form>
  )
}
