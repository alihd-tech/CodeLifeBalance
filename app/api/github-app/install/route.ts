import { randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import {
  getGitHubAppInstallUrl,
  isGitHubAppConfigured,
} from "@/lib/github-app"

export async function GET(request: Request) {
  if (!isGitHubAppConfigured()) {
    return NextResponse.redirect(new URL("/integrations/github?error=not_configured", request.url))
  }

  const state = randomBytes(24).toString("base64url")
  const session = await getSession()
  session.githubAppOAuthState = state
  await session.save()

  return NextResponse.redirect(getGitHubAppInstallUrl(state))
}
