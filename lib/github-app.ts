import {
  createHmac,
  createSign,
  timingSafeEqual,
} from "node:crypto"

const GITHUB_API = "https://api.github.com"
const GITHUB_API_VERSION = "2026-03-10"

export interface GitHubAppInstallation {
  id: number
  account: {
    login: string
    type: string
    avatar_url?: string
    html_url?: string
  } | null
  repository_selection?: string
  permissions?: Record<string, string>
}

export interface GitHubAppRepository {
  id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
  default_branch: string
}

export interface GitHubTeam {
  id: number
  name: string
  slug: string
  privacy?: string
  html_url?: string
}

function normalizePrivateKey(value: string) {
  return value.replaceAll("\\n", "\n")
}

function base64url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "")
}

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "code-life-balance-github-app",
  }
}

export function isGitHubAppConfigured() {
  return Boolean(
    process.env.GITHUB_APP_ID &&
      process.env.GITHUB_APP_CLIENT_ID &&
      process.env.GITHUB_APP_CLIENT_SECRET &&
      process.env.GITHUB_APP_PRIVATE_KEY &&
      process.env.GITHUB_APP_WEBHOOK_SECRET &&
      process.env.GITHUB_APP_SLUG
  )
}

export function getGitHubAppInstallUrl(state: string) {
  const slug = process.env.GITHUB_APP_SLUG
  if (!slug) throw new Error("GITHUB_APP_SLUG is not configured")
  return `https://github.com/apps/${encodeURIComponent(slug)}/installations/new?state=${encodeURIComponent(state)}`
}

export function createGitHubAppJwt() {
  const appId = process.env.GITHUB_APP_ID
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY

  if (!appId || !privateKey) {
    throw new Error("GitHub App ID/private key are not configured")
  }

  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const payload = base64url(
    JSON.stringify({
      iat: now - 60,
      exp: now + 9 * 60,
      iss: appId,
    })
  )
  const unsigned = `${header}.${payload}`
  const signer = createSign("RSA-SHA256")
  signer.update(unsigned)
  signer.end()
  const signature = signer.sign(normalizePrivateKey(privateKey))

  return `${unsigned}.${base64url(signature)}`
}

async function githubJson<T>(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      ...githubHeaders(token),
      ...(init.headers || {}),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(
      `GitHub API request failed (${response.status}) for ${path}${detail ? `: ${detail.slice(0, 200)}` : ""}`
    )
  }

  return response.json() as Promise<T>
}

export async function getGitHubAppInstallation(installationId: number) {
  return githubJson<GitHubAppInstallation>(
    `/app/installations/${installationId}`,
    createGitHubAppJwt()
  )
}

export async function createInstallationAccessToken(
  installationId: number,
  options?: {
    repositoryIds?: number[]
    permissions?: Record<string, "read" | "write">
  }
) {
  const body: Record<string, unknown> = {}
  if (options?.repositoryIds?.length) body.repository_ids = options.repositoryIds
  if (options?.permissions) body.permissions = options.permissions

  return githubJson<{
    token: string
    expires_at: string
    permissions: Record<string, string>
  }>(
    `/app/installations/${installationId}/access_tokens`,
    createGitHubAppJwt(),
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }
  )
}

export async function listInstallationRepositories(installationId: number) {
  const { token } = await createInstallationAccessToken(installationId)
  const first = await githubJson<{
    total_count: number
    repositories: GitHubAppRepository[]
  }>("/installation/repositories?per_page=100&page=1", token)

  if (first.total_count <= first.repositories.length) return first.repositories

  const repositories = [...first.repositories]
  const pages = Math.min(5, Math.ceil(first.total_count / 100))
  for (let page = 2; page <= pages; page++) {
    const result = await githubJson<{
      repositories: GitHubAppRepository[]
    }>(`/installation/repositories?per_page=100&page=${page}`, token)
    repositories.push(...result.repositories)
  }
  return repositories
}

export async function listOrganizationTeams(
  installationId: number,
  organization: string
) {
  const { token } = await createInstallationAccessToken(installationId, {
    permissions: { members: "read" },
  })
  return githubJson<GitHubTeam[]>(
    `/orgs/${encodeURIComponent(organization)}/teams?per_page=100`,
    token
  )
}

export async function exchangeGitHubAppUserCode(code: string) {
  const clientId = process.env.GITHUB_APP_CLIENT_ID
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("GitHub App OAuth credentials are not configured")
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`GitHub App user token exchange failed (${response.status})`)
  }

  const body = (await response.json()) as {
    access_token?: string
    error?: string
    error_description?: string
  }

  if (!body.access_token) {
    throw new Error(
      body.error_description || body.error || "GitHub App user token exchange failed"
    )
  }

  return body.access_token
}

export async function listUserAccessibleInstallations(userAccessToken: string) {
  const first = await githubJson<{
    total_count: number
    installations: GitHubAppInstallation[]
  }>("/user/installations?per_page=100&page=1", userAccessToken)

  return first.installations
}

export function verifyGitHubWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
) {
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET
  if (!secret || !signatureHeader?.startsWith("sha256=")) return false

  const expected = `sha256=${createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`

  const expectedBytes = Buffer.from(expected)
  const actualBytes = Buffer.from(signatureHeader)
  return (
    expectedBytes.length === actualBytes.length &&
    timingSafeEqual(expectedBytes, actualBytes)
  )
}
