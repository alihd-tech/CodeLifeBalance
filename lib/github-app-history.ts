import { appendFile, mkdir, readFile } from "node:fs/promises"
import { dirname } from "node:path"

export interface GitHubAppHistoryEvent {
  receivedAt: string
  deliveryId: string
  event: string
  action?: string
  installationId?: number
  repository?: string
  sender?: string
  ref?: string
  number?: number
}

export function isGitHubAppHistoryEnabled() {
  return Boolean(process.env.GITHUB_APP_HISTORY_PATH)
}

export function normalizeGitHubWebhookEvent(
  event: string,
  deliveryId: string,
  payload: Record<string, any>
): GitHubAppHistoryEvent {
  return {
    receivedAt: new Date().toISOString(),
    deliveryId,
    event,
    action: typeof payload.action === "string" ? payload.action : undefined,
    installationId:
      typeof payload.installation?.id === "number"
        ? payload.installation.id
        : undefined,
    repository:
      typeof payload.repository?.full_name === "string"
        ? payload.repository.full_name
        : undefined,
    sender:
      typeof payload.sender?.login === "string"
        ? payload.sender.login
        : undefined,
    ref: typeof payload.ref === "string" ? payload.ref : undefined,
    number:
      typeof payload.number === "number"
        ? payload.number
        : undefined,
  }
}

export async function appendGitHubAppHistory(
  entry: GitHubAppHistoryEvent
) {
  const file = process.env.GITHUB_APP_HISTORY_PATH
  if (!file) return false

  await mkdir(dirname(file), { recursive: true })
  await appendFile(file, JSON.stringify(entry) + "\n", {
    encoding: "utf8",
    mode: 0o600,
  })
  return true
}

export async function readGitHubAppHistory(
  installationId: number,
  limit = 50
) {
  const file = process.env.GITHUB_APP_HISTORY_PATH
  if (!file) return []

  try {
    const content = await readFile(file, "utf8")
    return content
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as GitHubAppHistoryEvent)
      .filter((entry) => entry.installationId === installationId)
      .slice(-Math.max(1, Math.min(limit, 200)))
      .reverse()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return []
    throw error
  }
}
