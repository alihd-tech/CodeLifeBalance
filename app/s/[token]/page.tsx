import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Activity } from "lucide-react"
import { decodeShareCard, chronotype, formatHour, scoreLabel } from "@/lib/share"

interface Props {
  params: Promise<{ token: string }>
}

function origin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const card = decodeShareCard(token)

  if (!card) {
    return { title: "Code Life Balance", robots: { index: false } }
  }

  const title = `@${card.u} scored ${card.s}/100 on Code Life Balance`
  const description = `${scoreLabel(card.s)}. ${chronotype(card)}, peaking at ${formatHour(
    card.ph
  )}, with ${card.wk}% of commits on weekends.`
  const image = `${origin()}/api/share/image?t=${token}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  }
}

/**
 * Public, unauthenticated page behind a share link. Everything it renders comes
 * from the signed token, so it never touches the visitor's session.
 */
export default async function SharePage({ params }: Props) {
  const { token } = await params
  const card = decodeShareCard(token)
  if (!card) notFound()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 gap-8">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
          <Activity className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-base tracking-tight text-foreground">
          Code Life Balance
        </span>
      </div>

      {/* The same image that X renders in the timeline */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/share/image?t=${token}`}
        alt={`${card.u} scored ${card.s} out of 100 on Code Life Balance`}
        width={1200}
        height={630}
        className="w-full max-w-3xl rounded-xl border border-border"
      />

      <div className="text-center max-w-md space-y-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground text-balance">
          {card.n || `@${card.u}`} scored {card.s}/100
        </h1>
        <p className="text-sm text-muted-foreground text-balance">
          {scoreLabel(card.s)}. {chronotype(card)}, peaking at {formatHour(card.ph)}, with{" "}
          {card.wk}% of commits landing on weekends.
        </p>
      </div>

      <Link
        href="/"
        className="px-5 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Analyze my GitHub
      </Link>
    </div>
  )
}
