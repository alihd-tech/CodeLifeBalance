# Code Life Balance

> Know when you live to code, and when you don't.

Privacy-first GitHub activity analytics for the web, GitHub Actions, and the command line. Code Life Balance turns recent activity into commit timing, active hours, language distribution, repository insights, and a scored code-life balance report without requiring users to hand credentials to CodeLifeBalance.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, and Recharts.

**Repository:** https://github.com/alihd-tech/CodeLifeBalance

## Features

- **Privacy-first GitHub Action.** Runs inside the user's GitHub Actions runner and generates SVG, JSON, and Markdown without sending the token or report to CodeLifeBalance.
- **Local CLI.** Uses `GITHUB_TOKEN` or an existing `gh auth` session and writes the same artifacts locally.
- **Workflow configurator.** The `/configure` page generates workflow YAML and the equivalent CLI command entirely in the browser.
- **Public username viewer.** Public activity remains available without authorization.
- **Legacy hosted OAuth dashboard.** Still available during the migration, but no longer the primary path.
- **Balance score (0 to 100).** Derived from weekend, after-hours, late-night, and commit-volume patterns, with actionable recommendations.
- **Commit timing analysis.** Hour-of-day and day-of-week distributions, peak hour and day, plus five named time sessions (Early Bird, Morning, Afternoon, Evening, Night Owl).
- **Language breakdown.** Primary-language distribution across your owned repositories.
- **Top repositories.** Ranked by stars, with forks and language.
- **Event breakdown.** Pushes, pull requests, issues, reviews, releases, and more.
- **Streaks and totals.** Current streak, longest streak, total stars and forks, average commits per day.
- **Light and dark themes.** A light, dark, and system toggle in the header, persisted in `localStorage` and applied before first paint so there is no flash.


## Privacy-first usage

### GitHub Action

The recommended mode runs on GitHub's runner and keeps credentials in GitHub.

```yaml
name: Code Life Balance

on:
  workflow_dispatch:
  schedule:
    - cron: "17 3 * * 1"

permissions:
  contents: write

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: alihd-tech/CodeLifeBalance@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          username: ${{ github.repository_owner }}
          timezone: "UTC"
          workday-start: "9"
          workday-end: "18"
          theme: "dark"
          card-style: "detailed"
          formats: "svg,json,markdown"
          output-dir: "code-life-balance"
          commit: "true"
```

For private owned repositories, create a user-owned fine-grained token with only the read access you want, store it as `CODE_LIFE_TOKEN`, pass that secret as `github-token`, and set `include-private: "true"`. Private mode verifies that the token owner matches the username being analyzed.

### Local CLI

Authenticate with GitHub CLI:

```bash
gh auth login
```

Then run:

```bash
pnpm cli -- --username octocat --timezone Europe/Helsinki
```

Private mode stays on the local machine:

```bash
pnpm cli -- --include-private --timezone Europe/Helsinki
```

The CLI prefers `GITHUB_TOKEN`, then `gh auth token`. Public analysis can run without credentials when a username is supplied.

### Web configurator

Open `/configure` in the web app to choose timezone, work hours, theme, card style, output formats, schedule, and private/public mode. The page only generates configuration and does not request a GitHub token.

## Architecture

```
app/
  page.tsx                    Landing page
  dashboard/page.tsx          Legacy hosted authenticated dashboard
  configure/page.tsx          Privacy-first Action and CLI configurator
  u/[username]/page.tsx       Public username viewer
  layout.tsx                  Fonts, metadata, Vercel Analytics (production only)
  api/
    auth/route.ts             Redirects to the GitHub OAuth authorize URL
    auth/callback/route.ts    Exchanges the code for a token, stores it in the session
    auth/logout/route.ts      Destroys the session
    analyze/route.ts          Authenticated JSON endpoint returning the full analysis
  opengraph-image.tsx         Generated 1200x630 social card
  robots.ts, sitemap.ts       Crawler directives and sitemap
  manifest.ts                 Web app manifest
components/
  dashboard-client.tsx        Client component; fetches /api/analyze with SWR
  *.tsx                       Individual charts and panels
  ui/                         shadcn/ui primitives
lib/
  github.ts                   GitHub API transport; delegates calculations to the shared core
  session.ts                  iron-session configuration and types
  site.ts                     Canonical URL, authorship and SEO copy
  theme.ts                    Theme storage key and the pre-paint init script
packages/
  core/index.mjs              Provider-agnostic analytics engine shared by every surface
  github-client/index.mjs     Reusable GitHub REST transport for Action and CLI
  report/index.mjs            Shared SVG, JSON, and Markdown report rendering
action/
  index.mjs                   Dependency-free GitHub Action runtime
cli/
  index.mjs                   Local privacy-first command line interface
action.yml                    GitHub Action metadata and inputs
```

The analytics engine in `packages/core/index.mjs` is provider-agnostic. The GitHub Action and CLI share `packages/github-client` for GitHub REST access and `packages/report` for SVG, JSON, and Markdown generation. The public and legacy hosted web views reuse the same core through `lib/github.ts`. The recommended private path never goes through the Next.js server.

**Data sources and limits.** Repositories come from `GET /user/repos` (owner affiliation, up to 5 pages). Activity comes from `GET /users/{username}/events` (up to 3 pages). The GitHub Events API only exposes roughly the last 90 days and 300 events, so all commit-timing metrics describe recent activity rather than your full history. The shared analytics core buckets timestamps in an explicit IANA timezone. The web app currently defaults to UTC; the Action exposes a `timezone` input.

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
| `NEXT_PUBLIC_SITE_URL` | Optional | Overrides the canonical origin used for metadata, sitemap and social cards. Defaults to `https://coder-life.vercel.app`. |
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
| `pnpm test:core` | Run provider-agnostic analytics engine tests. |
| `pnpm cli -- --help` | Show local CLI options. |

## Deployment

The app is a standard Next.js application and deploys to Vercel or any Node.js host without additional configuration.

1. Push the repository to GitHub and import it into your hosting provider.
2. Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `SESSION_SECRET` as environment variables.
3. Set `NEXT_PUBLIC_SITE_URL` if the deployment is not on the canonical domain.
4. Update the OAuth App's **Authorization callback URL** to `https://your-domain.com/api/auth/callback`.

Security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`) are applied to all routes in [next.config.mjs](next.config.mjs). Note that the same file sets `typescript.ignoreBuildErrors: true`, so type errors will not fail a production build. Run `tsc --noEmit` in CI if you want them enforced.

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

Code Life Balance now has distinct trust modes:

| Mode | Credential location | CodeLifeBalance receives token? | Private repository support |
| --- | --- | --- | --- |
| GitHub Action | GitHub Actions secret/runtime | No | Optional with user-owned fine-grained token |
| Local CLI | Local environment or `gh auth` | No | Optional |
| Public viewer | None required | No | No |
| Legacy hosted dashboard | Encrypted browser session cookie | Hosted app handles token | Yes |

The Action runtime calls GitHub's API directly and writes artifacts only into the workflow workspace. The local CLI does the same on the user's machine. The configurator never asks for credentials.

The legacy OAuth flow is retained during migration and still requests the broad `repo` scope. It should not be treated as the preferred privacy-first path and is expected to be reduced or replaced in the later GitHub App phase.

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
