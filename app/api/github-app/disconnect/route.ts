import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function POST(request: Request) {
  const session = await getSession()
  delete session.githubAppInstallation
  delete session.githubAppOAuthState
  await session.save()

  return NextResponse.redirect(new URL("/integrations/github?disconnected=1", request.url), 303)
}
