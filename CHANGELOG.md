# Changelog

All notable Code Life Balance releases are documented here.

## Unreleased

### Added
- Permanent CI with tests, strict typecheck, production build, and Action self-test.
- Recurring smoke test for the published `v1` GitHub Action.
- Optional GitHub App foundation for verified installations, signed webhooks, organization/team discovery, and opt-in event history.
- Privacy, support, security, and GitHub App setup documentation.

### Changed
- Production session creation now fails closed when `SESSION_SECRET` is missing or too short.
- Production builds no longer ignore TypeScript errors.

## 1.0.0 - 2026-09-21

### Added
- Privacy-first GitHub Action.
- Provider-independent analytics core.
- Local CLI.
- Browser workflow configurator.
- Public username viewer.
- SVG, JSON, and Markdown report generation.
- Timezone and workday configuration.
- Dark/light and compact/detailed report cards.
- Optional user-owned token support for private analysis.

The stable major alias `v1` points to the current compatible v1 release.
