# Project setup (vscode-md-review)

This document records how the extension repository is structured, how to verify it locally, and how to publish **from your machine** (no CI).

Product requirements live in [requirement.md](requirement.md).

## Goals

- TypeScript VS Code extension aligned with tooling patterns from [vscode-phpunit-in-docker](https://github.com/Michael-vb/vscode-phpunit-in-docker) (compile, ESLint, integration tests, vsce, ovsx).
- Stub behavior only: command `markdownReview.hello` proves activation and packaging.
- **No** GitHub Actions or other CI for this phase.

## Repository layout

| Path | Purpose |
|------|---------|
| `src/extension.ts` | Extension entry: `activate` / `deactivate`. |
| `src/test/extension.test.ts` | Integration test run inside Extension Host (`vscode-test`). |
| `package.json` | Manifest, `contributes`, npm scripts. |
| `tsconfig.json` | `Node16`, `ES2022`, `out/` output, `strict`. |
| `eslint.config.mjs` | ESLint 9 flat config for `src/**/*.ts`. |
| `.vscode-test.mjs` | `@vscode/test-cli`: test files = `out/test/**/*.test.js`. |
| `.vscodeignore` | Files excluded from `.vsix` (includes `src/**`, `.cursor/**`, `out/test/**`). |
| `.vscode/` | `launch.json` (Run Extension), `tasks.json` (default build = watch), `extensions.json` (recommendations). |

## npm scripts

| Script | Command |
|--------|---------|
| `compile` | `tsc -p ./` |
| `watch` | `tsc -watch -p ./` |
| `lint` | `eslint src` |
| `pretest` | compile + lint |
| `test` | `vscode-test` |
| `vscode:prepublish` | compile (runs before vsce publish/package) |
| `package:vsix` | `vsce package --no-dependencies` |
| `publish:vsce` | `vsce publish` |
| `publish:openvsx` | `ovsx publish` |

## Verification checklist

1. `npm install && npm run compile` — succeeds.
2. `npm run lint` — no errors.
3. `npm test` — passes (first run may download VS Code into `.vscode-test/`).
4. F5 **Run Extension** — Command Palette → **Hello (Markdown Review)** — status bar message.
5. `npm run package:vsix` — creates `vscode-md-review-0.0.1.vsix` without bundling `.cursor/` or test output.

## Publishing (manual)

### Prerequisites

- Set `publisher` and repository fields in `package.json` to match your [Visual Studio Marketplace publisher](https://marketplace.visualstudio.com/manage).
- Optional: add `icon.png` and reference it in `package.json` to silence packaging warnings.

### Visual Studio Marketplace

- Obtain a PAT with Marketplace **Manage** scope; sign in with `vsce login` or `VSCE_PAT`.
- Run `npm run publish:vsce` from a clean `npm run compile`.

### Open VSX

- Create `OVSX_PAT` at [open-vsx.org](https://open-vsx.org/).
- Run `npm run publish:openvsx`.

## CI

Intentionally **not** configured; releases are local only for now.
