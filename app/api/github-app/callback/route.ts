import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import {
  exchangeGitHubAppUserCode,
  listUserAccessibleInstallations,
} from "@/lib/github-app"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const installationIdRaw = url.searchParams.get("installation_id")

  const session = await getSession()
  const expectedState = session.githubAppOAuthState
  delete session.githubAppOAuthState

  if (!code || !state || !expectedState || state !== expectedState) {
    await session.save()
    return NextResponse.redirect(new URL("/integrations/github?error=invalid_state", request.url))
  }

  const installationId = Number(installationIdRaw)
  if (!Number.isInteger(installationId) || installationId <= 0) {
    await session.save()
    return NextResponse.redirect(new URL("/integrations/github?error=missing_installation", request.url))
  }

  try {
    const userAccessToken = await exchangeGitHubAppUserCode(code)
    const installations = await listUserAccessibleInstallations(userAccessToken)
    const installation = installations.find((item) => item.id === installationId)

    if (!installation) {
      await session.save()
      return NextResponse.redirect(
        new URL("/integrations/github?error=installation_not_authorized", request.url)
      )
    }

    session.githubAppInstallation = {
      id: installation.id,
      accountLogin: installation.account?.login,
      accountType: installation.account?.type,
    }
    await session.save()

    return NextResponse.redirect(new URL("/integrations/github?connected=1", request.url))
  } catch {
    await session.save()
    return NextResponse.redirect(new URL("/integrations/github?error=callback_failed", request.url))
  }
}
