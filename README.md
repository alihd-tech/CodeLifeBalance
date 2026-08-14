# Code Life Balance

> Know when you live to code, and when you don't.

A Next.js web app that signs you in with GitHub, analyzes your recent activity, and turns it into an interactive dashboard: commit timing, active hours, language distribution, top repositories, and a scored work-life balance report with personalized recommendations.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, and Recharts.

**Repository:** https://github.com/alihd-tech/CodeLifeBalance

## Features

- **GitHub OAuth sign-in.** Encrypted, `httpOnly` cookie sessions via `iron-session`, with no database required.
- **Balance score (0 to 100).** Derived from weekend, after-hours, late-night, and commit-volume patterns, with actionable recommendations.
- **Commit timing analysis.** Hour-of-day and day-of-week distributions, peak hour and day, plus five named time sessions (Early Bird, Morning, Afternoon, Evening, Night Owl).
- **Language breakdown.** Primary-language distribution across your owned repositories.
- **Top repositories.** Ranked by stars, with forks and language.
- **Event breakdown.** Pushes, pull requests, issues, reviews, releases, and more.
- **Streaks and totals.** Current streak, longest streak, total stars and forks, average commits per day.
- **Share to X.** Turns a result into a signed public link with a generated 1200x630 card, opens the X composer with prefilled text, and offers the card as a PNG download.
- **Light and dark themes.** A light, dark, and system toggle in the header, persisted in `localStorage` and applied before first paint so there is no flash.

## Architecture

```
app/
  page.tsx                    Landing page
  dashboard/page.tsx          Server component; requires a session, renders the profile banner
  layout.tsx                  Fonts, metadata, Vercel Analytics (production only)
  api/
    auth/route.ts             Redirects to the GitHub OAuth authorize URL
    auth/callback/route.ts    Exchanges the code for a token, stores it in the session
    auth/logout/route.ts      Destroys the session
    analyze/route.ts          Authenticated JSON endpoint returning the full analysis
    share/route.ts            Mints a signed share token from the current result
    share/image/route.tsx     Renders the 1200x630 share card as a PNG
  s/[token]/page.tsx          Public share page carrying the Open Graph tags
components/
  dashboard-client.tsx        Client component; fetches /api/analyze with SWR
  *.tsx                       Individual charts and panels
  ui/                         shadcn/ui primitives
lib/
  github.ts                   GitHub API fetching and all analysis logic
  session.ts                  iron-session configuration and types
  share.ts                    Signed share tokens, card copy, tweet text
  theme.ts                    Theme storage key and the pre-paint init script
```

Data flow: the dashboard page verifies the session on the server, then `DashboardClient` fetches `/api/analyze` with SWR. That route calls `analyzeUser()` in [lib/github.ts](lib/github.ts), which fetches repositories and events in parallel and computes every derived metric in a single pass. Responses are cached for five minutes on the server (`next.revalidate`) and deduped for five minutes on the client.

**Data sources and limits.** Repositories come from `GET /user/repos` (owner affiliation, up to 5 pages). Activity comes from `GET /users/{username}/events` (up to 3 pages). The GitHub Events API only exposes roughly the last 90 days and 300 events, so all commit-timing metrics describe recent activity rather than your full history. Timestamps are bucketed in the server's local timezone.

## Getting started

### Prerequisites

- Node.js 20 or newer
- [pnpm](https://pnpm.io/) (a `pnpm-lock.yaml` is committed)
- A GitHub OAuth App

### 1. Clone the repository

```bash
git clone https://github.com/alihd-tech/CodeLifeBalance.git
```

### 2. Create a GitHub OAuth App

In GitHub, go to **Settings > Developer settings > OAuth Apps > New OAuth App** and set:

| Field | Value (local development) |
| --- | --- |
| Homepage URL | `http://localhost:3000` |
| Authorization callback URL | `http://localhost:3000/api/auth/callback` |

Copy the generated **Client ID** and **Client Secret**.

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
SESSION_SECRET=a_random_string_of_at_least_32_characters
```

| Variable | Required | Description |
| --- | --- | --- |
| `GITHUB_CLIENT_ID` | Yes | OAuth App client ID. |
| `GITHUB_CLIENT_SECRET` | Yes | OAuth App client secret. |
| `NEXT_PUBLIC_SITE_URL` | For sharing | Canonical public origin, for example `https://your-domain.com`. Used to build share links and the Open Graph image URL. Falls back to the request origin. |
| `SESSION_SECRET` | Yes in production | Key used to encrypt the session cookie; must be at least 32 characters. Falls back to a hardcoded development default if unset, so never rely on that fallback outside local development. |

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Install and run

```bash
pnpm install
```

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Analyze my GitHub**.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server on port 3000. |
| `pnpm build` | Create a production build. |
| `pnpm start` | Serve the production build. |
| `pnpm lint` | Run ESLint. |

## Deployment

The app is a standard Next.js application and deploys to Vercel or any Node.js host without additional configuration.

1. Push the repository to GitHub and import it into your hosting provider.
2. Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `SESSION_SECRET` as environment variables.
3. Set `NEXT_PUBLIC_SITE_URL` to the deployed origin so share cards resolve.
4. Update the OAuth App's **Authorization callback URL** to `https://your-domain.com/api/auth/callback`.

Security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`) are applied to all routes in [next.config.mjs](next.config.mjs). Note that the same file sets `typescript.ignoreBuildErrors: true`, so type errors will not fail a production build. Run `tsc --noEmit` in CI if you want them enforced.

## Sharing to X

X cannot attach an image through a web intent, so the flow works the way every
score-card site does it: the tweet carries a link, and X renders the card image
from that link's Open Graph tags.

1. **Post to X** asks `/api/share` for a signed token built from the numbers on
   screen, then opens the X composer with prefilled text and the share URL.
2. X fetches `/s/<token>`, reads its `twitter:card` tags, and shows the PNG from
   `/api/share/image` as a large summary card.
3. **Image** downloads that same PNG if you would rather attach it by hand, and
   **Link** copies the share URL.

Tokens are HMAC-signed with `SESSION_SECRET`, so the image endpoint cannot be
driven with arbitrary numbers, and the handle on the card always comes from the
session rather than the request body. A share link is public and unauthenticated
by design: anyone holding it sees the stats it encodes, and nothing else.

For the card to appear on X, the deployment must be publicly reachable and
`NEXT_PUBLIC_SITE_URL` must be set to its canonical origin. On localhost the
buttons work, but X cannot fetch the preview.

## Theming

`app/globals.css` defines the light palette on `:root` and the dark palette on
both `.dark` and a `prefers-color-scheme` block, so the app follows the system
setting until the visitor picks a side. The header toggle writes `light`, `dark`,
or `system` to `localStorage` under `clb-theme`, and a small inline script in the
root layout applies it before first paint.

Contrast was checked against WCAG AA in both themes: body text is about 18:1,
muted text about 7.7:1 in light and 8.7:1 in dark, and the primary green clears
4.5:1 both as text and behind button labels.

## Privacy and permissions

- The OAuth flow requests the `read:user` and `repo` scopes. `repo` grants read *and write* access to private repositories. The app only reads, but if you do not need private repository data, narrowing the scope in [app/api/auth/route.ts](app/api/auth/route.ts) is recommended.
- The access token and profile are stored only in an encrypted, `httpOnly` session cookie that expires after 24 hours. Nothing is persisted server-side and there is no database.
- Results stay private until you share them. Creating a share link publishes the encoded summary numbers, your handle, display name, and avatar to anyone with that URL.
- All analysis runs on your own server against the GitHub API, and no activity data is sent to third parties. Vercel Analytics is loaded in production builds only.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS v4, `tw-animate-css` |
| Components | shadcn/ui, Base UI, Radix icons, Lucide |
| Charts | Recharts 3 |
| Data fetching | SWR |
| Sessions | iron-session |

## Contributing

Contributions are welcome. To propose a change:

1. Fork the repository and create a branch from `main`.
2. Run `pnpm lint` and `pnpm build` before opening a pull request.
3. Keep pull requests focused, and describe the user-visible effect of the change.

For bugs and feature ideas, open an issue at https://github.com/alihd-tech/CodeLifeBalance/issues.

## License

Released under the MIT License. See [LICENSE](LICENSE) for details.
