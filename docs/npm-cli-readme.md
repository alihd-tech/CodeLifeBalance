# Code Life Balance CLI

Run Code Life Balance locally without sending your GitHub credential or generated report to Code Life Balance infrastructure.

## Run without installing

```bash
npx code-life-balance --username octocat --timezone Europe/Helsinki
```

Or install globally:

```bash
npm install --global code-life-balance
code-life-balance --username octocat
```

## Authentication

The CLI resolves credentials in this order:

1. `GITHUB_TOKEN`, when present.
2. Your existing `gh auth token` session.
3. No token for public-only username analysis.

For private owned-repository analysis:

```bash
gh auth login
code-life-balance --include-private --timezone Europe/Helsinki
```

Private mode verifies that the authenticated token owner matches the username being analyzed.

## Options

```text
--username <login>        GitHub username
--timezone <IANA>         IANA timezone, default UTC
--workday-start <0-23>    Workday start hour, default 9
--workday-end <1-24>      Workday end hour, default 18
--output-dir <path>       Output directory
--theme <dark|light>      SVG theme
--card-style <style>      detailed or compact
--formats <list>          svg,json,markdown
--include-private         Include authenticated private owned activity
--public-only             Force public-only analysis
--no-gh                   Do not read GitHub CLI authentication
--help                    Show CLI help
```

Generated output can include:

- `code-life.svg`
- `stats.json`
- `report.md`

## Privacy

The CLI calls the GitHub API directly from your machine. It does not send your GitHub token or generated report to a Code Life Balance service.

Repository: https://github.com/alihd-tech/CodeLifeBalance
