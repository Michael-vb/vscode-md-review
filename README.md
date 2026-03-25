# Markdown Review

Review Markdown files by leaving multiple anchored comments, then copy all comments for the current file to your clipboard in an AI-friendly format.

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/xMIkeXeeioi.vscode-md-review)](https://marketplace.visualstudio.com/items?itemName=xMIkeXeeioi.vscode-md-review)
[![Open VSX Version](https://img.shields.io/open-vsx/v/xMIkeXeeioi/vscode-md-review)](https://open-vsx.org/extension/xMIkeXeeioi/vscode-md-review)

## Features

- Leave **anchored review notes** on selected text in Markdown files
- Edit / delete notes
- **Copy Review**: export all comments for the active file to clipboard (ready to paste into an AI chat)
- **Copy Review & Clean**: export + clear notes for that file
- Keyboard shortcuts

## Installation

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=xMIkeXeeioi.vscode-md-review) or from [Open VSX](https://open-vsx.org/extension/xMIkeXeeioi/vscode-md-review).

## Usage

1. Open a Markdown file.
2. Select text and add a comment using the standard VS Code comments UI (for example, click the gutter comment button / “+” next to the selection).
3. When you’re ready to send the review to an AI, use the keybindings:
   - **Copy Review**: `Cmd+Option+C` (macOS) / `Ctrl+Alt+C` (Windows/Linux)
   - **Copy Review & Clean**: `Cmd+Option+X` (macOS) / `Ctrl+Alt+X` (Windows/Linux)
4. Alternative: use the editor title actions (top-right of the editor):
   - **Copy Review**
   - **Copy Review & Clean**

### Keyboard shortcuts

- Copy Review:
  - macOS: `Cmd+Option+C`
  - Windows/Linux: `Ctrl+Alt+C`
- Copy Review & Clean:
  - macOS: `Cmd+Option+X`
  - Windows/Linux: `Ctrl+Alt+X`

## Clipboard export format

The exported text is designed to be pasted into an AI chat so it can apply the requested changes.

### Example 1 (multiple comments in one file)

```md
Each comment is tied to a specific file and line/range. Make edits that satisfy every comment.

File: docs/guide.md

- Location: L12 (range0: [11:0..11:42])
  Comment: Replace “utilize” with “use”.

- Location: L27-L29 (range0: [26:0..28:0])
  Comment: Convert this paragraph into 3 bullet points.

- Location: L54 (range0: [53:5..53:18])
  Comment: Fix the heading level to match surrounding sections (use `##` here).
```

### Example 2 (single-line selection)

```md
Each comment is tied to a specific file and line/range. Make edits that satisfy every comment.

File: README.md

- Location: L15 (range0: [14:10..14:42])
  Comment: Simplify this sentence; keep meaning.
```

## Development

```bash
npm install
npm run compile   # one-off build
npm run watch     # watch mode (default build task for F5)
npm run lint
npm test          # integration tests (downloads VS Code test host on first run)
```

Open this folder in VS Code and use **Run > Start Debugging** (F5) with the **Run Extension** launch configuration.

## License

MIT — see [LICENSE](LICENSE).
