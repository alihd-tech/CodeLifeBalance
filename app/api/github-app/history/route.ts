import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { readGitHubAppHistory } from "@/lib/github-app-history"

export async function GET() {
  const session = await getSession()
  const installationId = session.githubAppInstallation?.id

  if (!installationId) {
    return NextResponse.json({ error: "No GitHub App installation is linked" }, { status: 401 })
  }

  const events = await readGitHubAppHistory(installationId, 100)
  return NextResponse.json({ events })
}
