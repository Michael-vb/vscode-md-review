---
name: global-hotkey-workspace-copy
overview: Make the copy hotkeys work even when the editor isn’t focused, and change copy/clean to operate across all stored review notes in the workspace (all files with notes), not just the active file.
todos:
  - id: keybinding-when
    content: Update `package.json` keybinding `when` clauses to remove `editorTextFocus` and keep `resourceLangId == markdown`.
    status: completed
  - id: store-enumeration
    content: Add a `NoteStore` API to enumerate URIs/files with stored threads (workspace-wide).
    status: completed
  - id: copy-workspace
    content: Refactor/extend `src/extension.ts` to export and copy notes for all files with stored notes; reuse per-file formatting; add separators; handle empty state.
    status: completed
  - id: copy-clean-workspace
    content: Update `copyAndClean` to clean all copied notes across all files and dispose any materialized threads for those files.
    status: completed
  - id: tests
    content: Update `src/test/noteStore.test.ts` (and any relevant tests) to cover new enumeration behavior.
    status: completed
isProject: false
---

## What’s happening now

- The hotkeys are gated by a `when` clause that requires editor focus:

```72:84:/Users/mikhailbenedziktovich/projects/vscode-md-review/package.json
    "keybindings": [
      {
        "command": "markdownReview.copy",
        "key": "ctrl+alt+c",
        "mac": "cmd+alt+c",
        "when": "editorTextFocus && resourceLangId == markdown"
      },
      {
        "command": "markdownReview.copyAndClean",
        "key": "ctrl+alt+x",
        "mac": "cmd+alt+x",
        "when": "editorTextFocus && resourceLangId == markdown"
      }
    ],
```

- Copy is implemented as “active markdown editor only”:

```45:52:/Users/mikhailbenedziktovich/projects/vscode-md-review/src/extension.ts
	function activeMarkdownUri(): vscode.Uri | undefined {
		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.document.languageId !== 'markdown') {
			return undefined;
		}
		return editor.document.uri;
	}
```

- Notes are persisted per-file in a workspaceState map (`ThreadsByFile`) but there’s currently no public way to enumerate all file keys:

```22:31:/Users/mikhailbenedziktovich/projects/vscode-md-review/src/noteStore.ts
export type ThreadsByFile = Record<string, StoredThread[]>;

export class NoteStore {
	constructor(private readonly workspaceState: vscode.Memento) {}

	getThreads(uri: vscode.Uri): StoredThread[] {
		const map = this.loadMap();
		return map[uri.toString()] ?? [];
	}
```

## Proposed changes

- Update `package.json` keybindings to remove the `editorTextFocus` requirement, so the hotkeys still work while focus is in e.g. the Explorer/SCM/Problems/terminal, as long as the active editor is a Markdown resource.
  - Change `when` from `editorTextFocus && resourceLangId == markdown` to `resourceLangId == markdown`.
- Extend `NoteStore` to expose the set of URIs that have stored threads (workspace-wide).
  - Add something like `listThreadUris(): vscode.Uri[]` or `getAllThreadsByFile(): ThreadsByFile` (preferring a narrow API that doesn’t leak internal structure).
- Implement workspace-wide clipboard export in `src/extension.ts`.
  - New formatter that aggregates per-file exports:
    - Iterate all URIs with notes (from `NoteStore`), stable-sort by `fileLabel(uri)`.
    - For each URI, reuse the existing `formatClipboardExportForFile(uri)` (or refactor it into a helper that can be used both standalone and aggregated).
    - Concatenate with clear separators (e.g. a blank line + `---` + blank line between files).
  - Update `markdownReview.copy` to copy **all files with notes**.
  - Update `markdownReview.copyAndClean` to copy workspace-wide and then clean **everything that was copied**:
    - Delete all stored threads for all listed URIs.
    - Dispose any materialized threads for those URIs via `registry.getThreadsForUri(uri)`.
- Update/add tests in `src/test/noteStore.test.ts` to cover the new enumeration API (and optionally ensure that deleting the last thread removes the file key, which your current `deleteThread` already does).

## Constraints / edge cases handled

- If there are **no stored notes**, copying should show an informative message and avoid writing an empty boilerplate to clipboard.
- The extension currently activates on `onLanguage:markdown`. With the updated `when` clause, the hotkey will still only work when a Markdown editor is active (so activation should still happen naturally). If you want the commands available even before any Markdown editor is opened in a session, we can optionally add `onStartupFinished` later.

