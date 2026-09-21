# Publishing the Code Life Balance CLI to npm

The npm distribution is generated into `dist/npm`. It contains only the CLI and the shared runtime modules. It does not ship the Next.js website or web dependencies.

## Build and verify locally

```bash
pnpm install
pnpm test:npm-cli
```

The generated package has the unscoped npm name:

```text
code-life-balance
```

Users will be able to run:

```bash
npx code-life-balance --username octocat
```

## First publication

npm trusted-publisher configuration requires the package to already exist. The first publication therefore needs to be performed once by an npm maintainer with 2FA:

```bash
pnpm build:npm-cli
cd dist/npm
npm login
npm publish --access public
```

Before publishing, verify that the generated `package.json` has the intended version and that `npm pack --dry-run` lists only the CLI/shared runtime files.

## Configure trusted publishing

After the package exists on npmjs.com, open the package's trusted-publisher settings and add GitHub Actions:

- GitHub owner: `alihd-tech`
- Repository: `CodeLifeBalance`
- Workflow filename: `publish-npm-cli.yml`
- Allow action: direct `npm publish`

The workflow uses a GitHub-hosted runner and `id-token: write`, so npm can authenticate it using OIDC without a long-lived npm publish token.

## Subsequent releases

1. Publish the matching GitHub release/tag, for example `v1.2.0`.
2. Run **Publish npm CLI** from GitHub Actions.
3. Enter `1.2.0`.
4. The workflow checks out exactly `v1.2.0`, builds the CLI artifact, performs a dry-run pack, then publishes with npm trusted publishing.

The workflow intentionally requires an exact release tag so npm packages cannot accidentally be built from a moving branch.
