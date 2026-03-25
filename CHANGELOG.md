# Changelog

## [0.1.0] - 2026-03-25

### Added

- File-level actions for Markdown editors:
  - **Copy Review**: copies all review notes for the active file to clipboard in an AI-friendly format.
  - **Copy Review & Clean**: copies and then clears notes for the active file.
- Editor title buttons (visible in Markdown files).
- Keyboard shortcuts:
  - macOS: `Cmd+Option+C` (Copy Review), `Cmd+Option+X` (Copy Review & Clean)
  - Windows/Linux: `Ctrl+Alt+C`, `Ctrl+Alt+X`
- Extension icon (`icon.png`).

## [0.0.1] - 2026-03-22

### Added

- Project scaffold: TypeScript, ESLint, `@vscode/test-cli` integration tests.
- Stub command **Hello (Markdown Review)** (`markdownReview.hello`) — status bar confirmation that the extension loads.
- Scripts: `compile`, `watch`, `lint`, `test`, `package:vsix`, `publish:vsce`, `publish:openvsx`.
