/** Single source of truth for canonical URLs, authorship and SEO copy. */
export const siteConfig = {
  name: "Code Life Balance",
  shortName: "Code Life",
  tagline: "GitHub Activity Analyzer",
  title: "Code Life Balance: GitHub Activity Analyzer",
  description:
    "Analyze your GitHub activity to see when you actually code. Commit timing, active hours, language breakdown, top repos, and a scored work-life balance report with personalized recommendations.",
  /** Canonical production origin. Override locally with NEXT_PUBLIC_SITE_URL. */
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://coder-life.vercel.app",
  locale: "en_US",
  author: {
    name: "Ali HD",
    url: "https://alihd.space",
  },
  repository: "https://github.com/alihd-tech/CodeLifeBalance",
  keywords: [
    "GitHub activity analyzer",
    "GitHub stats",
    "commit patterns",
    "developer work-life balance",
    "coding habits",
    "commit heatmap",
    "GitHub insights",
    "developer burnout",
    "code time tracking",
    "GitHub wrapped",
    "open source dashboard",
    "Next.js",
  ],
  themeColor: {
    light: "#f2f7f4",
    dark: "#0d1410",
  },
} as const

/** Absolute URL for a site-relative path, needed for Open Graph and JSON-LD. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, siteConfig.url).toString()
}
