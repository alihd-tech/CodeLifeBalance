import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import {
  getGitHubAppInstallation,
  isGitHubAppConfigured,
  listInstallationRepositories,
} from "@/lib/github-app"
import { isGitHubAppHistoryEnabled } from "@/lib/github-app-history"

export async function GET() {
  const session = await getSession()
  const linked = session.githubAppInstallation

  if (!isGitHubAppConfigured()) {
    return NextResponse.json({
      configured: false,
      connected: false,
      historyEnabled: isGitHubAppHistoryEnabled(),
    })
  }

  if (!linked) {
    return NextResponse.json({
      configured: true,
      connected: false,
      historyEnabled: isGitHubAppHistoryEnabled(),
    })
  }

  try {
    const [installation, repositories] = await Promise.all([
      getGitHubAppInstallation(linked.id),
      listInstallationRepositories(linked.id),
    ])

    return NextResponse.json({
      configured: true,
      connected: true,
      historyEnabled: isGitHubAppHistoryEnabled(),
      installation: {
        id: installation.id,
        account: installation.account,
        repositorySelection: installation.repository_selection,
      },
      repositoryCount: repositories.length,
    })
  } catch {
    return NextResponse.json(
      {
        configured: true,
        connected: false,
        staleInstallation: true,
        historyEnabled: isGitHubAppHistoryEnabled(),
      },
      { status: 409 }
    )
  }
}
