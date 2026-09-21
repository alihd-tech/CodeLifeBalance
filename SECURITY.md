# Security Policy

## Supported versions

Security fixes are applied to the latest release line and the `v1` GitHub Action tag.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability involving credentials, GitHub App authentication, webhook validation, session handling, or private repository data.

Use GitHub's private vulnerability reporting feature for this repository when available. If private reporting is unavailable, contact the repository owner through the contact method listed on the GitHub profile.

Include:
- affected version or commit;
- reproduction steps;
- expected and observed behavior;
- impact;
- any suggested mitigation.

Do not include live access tokens, private keys, webhook secrets, session cookies, or private repository contents.

## Security model

The recommended GitHub Action and CLI modes are designed so Code Life Balance infrastructure does not receive the user's GitHub credential or generated private report.

The optional GitHub App is a separate advanced mode. Its server-side credentials must be stored only in deployment secrets. Installation access tokens are short-lived and generated only when needed.

Webhook requests are accepted only after HMAC signature verification with the configured webhook secret.

## Secrets

Production deployments must set a unique `SESSION_SECRET` of at least 32 characters. The application intentionally refuses to create hosted sessions in production without it.

Never commit:
- GitHub App private keys;
- GitHub App client secrets;
- webhook secrets;
- OAuth client secrets;
- personal access tokens;
- generated environment files containing secrets.
