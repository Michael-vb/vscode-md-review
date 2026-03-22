# Markdown Review

VS Code extension for reviewing Markdown plans and specs with anchored notes. **Current release is a stub** (hello command only) to validate the project setup; features are defined in `.cursor/plans/requirement.md`.

## Requirements

- [Node.js](https://nodejs.org/) (LTS recommended)
- [VS Code](https://code.visualstudio.com/) `^1.96.0` (or compatible editors: Cursor, Kiro)

## Development

```bash
npm install
npm run compile   # one-off build
npm run watch     # watch mode (default build task for F5)
npm run lint
npm test          # integration tests (downloads VS Code test host on first run)
```

Open this folder in VS Code and use **Run > Start Debugging** (F5) with the **Run Extension** launch configuration. Run **Hello (Markdown Review)** from the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).

## Packaging

```bash
npm run package:vsix
```

Produces `vscode-md-review-<version>.vsix` in the project root. Install locally: **Extensions** view → `...` → **Install from VSIX...**.

## Publishing (manual, no CI)

Replace `publisher` and repository URLs in `package.json` if they differ from your [publisher account](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#create-a-publisher).

### Visual Studio Marketplace

1. Create a [Personal Access Token](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token) with **Marketplace (Manage)** scope.
2. Sign in: `npx vsce login <publisher>` (or set `VSCE_PAT`).
3. `npm run publish:vsce` (runs `vsce publish`).

See [Publishing extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

### Open VSX

1. Create a token at [open-vsx.org](https://open-vsx.org/) (profile → Access Tokens).
2. `export OVSX_PAT=<token>`
3. `npm run publish:openvsx` (runs `ovsx publish`).

See [Open VSX Publishing](https://github.com/eclipse/openvsx/wiki/Publishing-Extensions).

## License

MIT — see [LICENSE](LICENSE).
