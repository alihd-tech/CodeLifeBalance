import { getIronSession, SessionOptions } from "iron-session"
import { cookies } from "next/headers"

export interface GitHubUser {
  id: number
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  public_repos: number
  followers: number
  following: number
  created_at: string
  html_url: string
}

export interface GitHubAppInstallationSession {
  id: number
  accountLogin?: string
  accountType?: string
}

export interface SessionData {
  accessToken?: string
  user?: GitHubUser
  githubAppInstallation?: GitHubAppInstallationSession
  githubAppOAuthState?: string
}

export function isSessionConfigured() {
  const configured = process.env.SESSION_SECRET
  return process.env.NODE_ENV !== "production" || Boolean(configured && configured.length >= 32)
}

function getSessionPassword() {
  const configured = process.env.SESSION_SECRET
  if (configured && configured.length >= 32) return configured

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters in production")
  }

  return "development-only-session-secret-change-me-32chars"
}

function getSessionOptions(): SessionOptions {
  return {
    password: getSessionPassword(),
    cookieName: "github-analyzer-session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    },
  }
}

export async function getSession() {
  return getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  )
}

export async function getOptionalSession() {
  if (!isSessionConfigured()) return null
  return getSession()
}
