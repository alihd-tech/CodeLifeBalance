# Optional GitHub App setup

The GitHub App is the advanced hosted layer for realtime events, installation-scoped repository access, organization/team discovery, and opt-in history. It is not required for the GitHub Action, CLI, configurator, or public viewer.

## Recommended registration

Create a GitHub App and configure:

- Homepage URL: your Code Life Balance site.
- Request user authorization (OAuth) during installation: **enabled**.
- Callback URL: `https://YOUR_HOST/api/github-app/callback`.
- Webhook: **active**.
- Webhook URL: `https://YOUR_HOST/api/github-app/webhook`.
- Webhook secret: a high-entropy secret.
- SSL verification: enabled.
- Installation availability: choose the accounts you intend to support.

Do not use the Setup URL flow for linking installations. Code Life Balance uses GitHub App user authorization and verifies that the returned installation is accessible to that user before storing the installation ID in the encrypted session.

## Minimum permissions

Start with read-only permissions and add only what your selected features need.

Repository permissions:
- Contents: Read-only, for repository/commit analytics and push events.
- Issues: Read-only, only if issue activity is included.
- Pull requests: Read-only, only if pull-request activity is included.

Organization permissions:
- Members: Read-only, only when organization/team discovery is enabled.

Subscribe only to events you use:
- Installation
- Installation repositories
- Push
- Pull request
- Issues

Avoid write permissions unless a future feature has a specific, documented need.

## Environment variables

```bash
GITHUB_APP_ID=
GITHUB_APP_CLIENT_ID=
GITHUB_APP_CLIENT_SECRET=
GITHUB_APP_PRIVATE_KEY=
GITHUB_APP_WEBHOOK_SECRET=
GITHUB_APP_SLUG=
```

The private key may be stored with literal `\n` characters; the runtime normalizes them before signing.

## Optional webhook history

For a self-hosted Node deployment with a persistent disk/volume:

```bash
GITHUB_APP_HISTORY_PATH=/var/lib/code-life-balance/github-events.ndjson
```

Validated webhook events are appended as NDJSON. Do not enable file history on ephemeral/serverless filesystems because it will not be durable.

History is opt-in. With no history path configured, webhook deliveries are verified and processed without persistent event storage.

## Token model

Code Life Balance creates a GitHub App JWT only on the server and exchanges it for installation access tokens when repository access is required. Installation tokens are not persisted and should be treated as short-lived credentials.

The user access token created during installation authorization is used only to verify that the user can access the selected installation, then discarded.
