---
name: md-review readme+changelog+icon
overview: "Update `vscode-md-review` docs to match the style of your `vscode-phpunit-in-docker` README, add an extension icon, and document the core workflow: leave multiple anchored comments in a Markdown file, then copy/export them to AI in one shot (optionally cleaning notes)."
todos:
  - id: readme
    content: Rewrite README to describe purpose, features, usage, and include clipboard export examples + badges
    status: completed
  - id: icon
    content: Add icon.png (copied from phpunit repo) and wire it via package.json "icon"
    status: completed
  - id: changelog
    content: Update CHANGELOG.md to describe new copy/export and clean functionality
    status: completed
isProject: false
---

## Scope

- Update docs to clearly describe purpose and basic functionality: **review Markdown files with multiple anchored comments** and **copy/export all comments for the current file** in one action to send to an AI.
- Mirror the style/structure of `../vscode-phpunit-in-docker/README.md` (headline, badges, Features, Installation, Usage, etc.).
- Reuse the same icon asset as `vscode-phpunit-in-docker/icon.png` for this extension.
- Update changelog to reflect the new review/copy functionality.

## Files to change

- `[README.md](/Users/mikhailbenedziktovich/projects/vscode-md-review/README.md)`
- `[CHANGELOG.md](/Users/mikhailbenedziktovich/projects/vscode-md-review/CHANGELOG.md)`
- `[package.json](/Users/mikhailbenedziktovich/projects/vscode-md-review/package.json)`
- Add new file: `icon.png` (copied from `../vscode-phpunit-in-docker/icon.png`)

## README content outline (modeled after phpunit README)

- **Title + one-liner**: “Markdown Review” + concise description of the workflow.
- **Badges**: Marketplace + OpenVSX badges using this extension id (based on `publisher` + `name` in `package.json`).
- **Features** (keep short and specific):
  - Add anchored review notes to selections in Markdown files
  - Edit/delete notes
  - Copy all notes for the active file to clipboard in a structured format for AI
  - Copy & clean (copy then clear notes for the file)
  - Keyboard shortcuts
- **Installation**: Marketplace/OpenVSX links.
- **Usage**:
  - Add comment via selection
  - Copy Review / Copy Review & Clean from editor title bar
  - Mention keybindings: `Cmd+Option+C` and `Cmd+Option+X` on macOS
- **Clipboard export format**: brief description + multiple examples
  - Example with 2–4 comments in one file
  - Show `Location` and `range0` usage

## Clipboard examples to include (must match current exporter)

Examples should start with the exact header line:

```text
Each comment is tied to a specific file and line/range. Make edits that satisfy every comment.
```

Then:

- `File: <relative-path-or-uri>`
- Bullet list with:
  - `- Location: L.. (range0: [startLine:startChar..endLine:endChar])`
  - `Comment: ...`

## Changelog update

Add a new unreleased section or bump version (depending on your preferred workflow) describing:

- Added file-level **Copy Review** and **Copy Review & Clean** commands
- Added editor title buttons for Markdown
- Added keybindings
- Added clipboard export format

## Icon wiring

- Copy `../vscode-phpunit-in-docker/icon.png` into this repo root as `icon.png`
- Add top-level `"icon": "icon.png"` to this repo’s `package.json`

## Verification

- Run `npm test` to ensure compile/lint/tests still pass
- Launch Extension Host and verify:
  - Buttons visible on Markdown editor title
  - Keybindings work
  - Clipboard content matches README examples and plan spec

