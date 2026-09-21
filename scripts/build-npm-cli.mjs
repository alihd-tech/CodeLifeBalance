import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

const root = process.cwd()
const out = resolve(root, "dist/npm")
const rootPackage = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"))

await rm(out, { recursive: true, force: true })
await mkdir(resolve(out, "cli"), { recursive: true })
await mkdir(resolve(out, "packages/core"), { recursive: true })
await mkdir(resolve(out, "packages/github-client"), { recursive: true })
await mkdir(resolve(out, "packages/report"), { recursive: true })

await cp(resolve(root, "cli/index.mjs"), resolve(out, "cli/index.mjs"))
await cp(resolve(root, "packages/core/index.mjs"), resolve(out, "packages/core/index.mjs"))
await cp(resolve(root, "packages/github-client/index.mjs"), resolve(out, "packages/github-client/index.mjs"))
await cp(resolve(root, "packages/report/index.mjs"), resolve(out, "packages/report/index.mjs"))
await cp(resolve(root, "LICENSE"), resolve(out, "LICENSE"))
await cp(resolve(root, "docs/npm-cli-readme.md"), resolve(out, "README.md"))

const packageJson = {
  name: "code-life-balance",
  version: process.env.CLI_PACKAGE_VERSION || rootPackage.version,
  description: "Privacy-first GitHub activity and code-life balance reports from your local machine.",
  type: "module",
  bin: {
    "code-life-balance": "./cli/index.mjs"
  },
  files: [
    "cli",
    "packages/core",
    "packages/github-client",
    "packages/report",
    "README.md",
    "LICENSE"
  ],
  engines: {
    node: ">=20"
  },
  license: "MIT",
  repository: {
    type: "git",
    url: "git+https://github.com/alihd-tech/CodeLifeBalance.git"
  },
  homepage: "https://github.com/alihd-tech/CodeLifeBalance#readme",
  bugs: {
    url: "https://github.com/alihd-tech/CodeLifeBalance/issues"
  },
  keywords: [
    "github",
    "developer",
    "activity",
    "analytics",
    "cli",
    "privacy",
    "productivity",
    "code-life-balance"
  ]
}

await writeFile(
  resolve(out, "package.json"),
  JSON.stringify(packageJson, null, 2) + "\n",
  "utf8"
)

console.log(`Built npm CLI package at ${out}`)
