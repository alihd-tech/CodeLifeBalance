import { NextResponse } from "next/server"
import {
  isGitHubAppConfigured,
  verifyGitHubWebhookSignature,
} from "@/lib/github-app"
import {
  appendGitHubAppHistory,
  normalizeGitHubWebhookEvent,
} from "@/lib/github-app-history"

export async function POST(request: Request) {
  if (!isGitHubAppConfigured()) {
    return NextResponse.json({ error: "GitHub App is not configured" }, { status: 503 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get("x-hub-signature-256")

  if (!verifyGitHubWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
  }

  let payload: Record<string, any>
  try {
    payload = JSON.parse(rawBody) as Record<string, any>
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const event = request.headers.get("x-github-event") || "unknown"
  const deliveryId = request.headers.get("x-github-delivery") || "unknown"
  const entry = normalizeGitHubWebhookEvent(event, deliveryId, payload)
  const stored = await appendGitHubAppHistory(entry)

  return NextResponse.json({
    ok: true,
    event,
    deliveryId,
    stored,
  })
}
