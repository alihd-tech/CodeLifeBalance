"use client"

import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { THEME_ORDER as ORDER, THEME_STORAGE_KEY as STORAGE_KEY, type Theme } from "@/lib/theme"

const ICONS = { light: Sun, dark: Moon, system: Monitor } as const
const LABELS = { light: "Light", dark: "Dark", system: "System" } as const

/** Applies the theme by toggling the classes globals.css keys off. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  if (theme !== "system") root.classList.add(theme)
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  // Start as "system" so server and first client render agree, then sync
  // to the stored value once mounted.
  const [theme, setTheme] = useState<Theme>("system")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && ORDER.includes(stored)) setTheme(stored)
    setMounted(true)
  }, [])

  function select(next: Theme) {
    setTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }

  const Icon = ICONS[theme]

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={`flex items-center gap-0.5 p-1 rounded-xl border border-border bg-card ${className}`}
    >
      {/* Compact single-button cycle on small screens */}
      <button
        onClick={() => select(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length])}
        aria-label={`Theme: ${LABELS[theme]}. Click to change.`}
        title={`Theme: ${LABELS[theme]}`}
        className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <Icon className="w-4.5 h-4.5" />
      </button>

      {/* Full segmented control from sm up */}
      {ORDER.map((option) => {
        const OptionIcon = ICONS[option]
        const active = mounted && theme === option
        return (
          <button
            key={option}
            role="radio"
            aria-checked={active}
            aria-label={LABELS[option]}
            title={LABELS[option]}
            onClick={() => select(option)}
            className={`hidden sm:flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <OptionIcon className="w-4.5 h-4.5" />
          </button>
        )
      })}
    </div>
  )
}
