---
name: Selected-text header
overview: Update review threads so each exported comment (and the in-editor thread header) includes the first line of the originally selected text, trimmed to 80 characters.
todos:
  - id: model-store-selected-line
    content: Extend StoredThread with selectedFirstLine and keep backward compatibility.
    status: completed
  - id: capture-selected-line
    content: Derive first-line-of-selection (trim to 80) when creating threads; set thread.label and persist it.
    status: completed
  - id: rematerialize-label
    content: Restore thread.label from stored selectedFirstLine when materializing threads.
    status: completed
  - id: export-format
    content: Update clipboard export to include a Selected line per comment.
    status: completed
  - id: tests
    content: Adjust/add tests for new field and trimming behavior.
    status: completed
isProject: false
---

## Goal

When a user anchors a note to a selection, capture the selection’s **first line** and:

- show it in the **comment thread header** (UI)
- include it in the **clipboard export** for each comment

If the first line is longer than 80 characters, trim it.

## Current behavior (what we’ll change)

- Clipboard export is built in `[src/extension.ts](src/extension.ts)` via `formatClipboardExportForFile()`; today it outputs only:
  - `- Location: ...`
  - `Comment: ...`
- Persisted thread data in `[src/noteStore.ts](src/noteStore.ts)` stores only range + comments (no selection text).

## Proposed data model change

- Extend `StoredThread` in `[src/noteStore.ts](src/noteStore.ts)` with an optional field:
  - `selectedFirstLine?: string`
- This keeps backward compatibility with already-saved threads.

## How we’ll capture the first line

In `[src/extension.ts](src/extension.ts)` when creating a thread from a selection (`addComment`):

- read selected text from the editor (`document.getText(selection)`)
- derive the first line:
  - split on `\r?\n`, take element 0
  - trim leading/trailing whitespace
  - if length > 80: truncate to 80 characters (plan default) or 77 + `...` (implementation choice)
- store this value into the persisted thread (`selectedFirstLine`)
- set `thread.label` to this value (so it becomes visible in the thread header). If missing/empty, fall back to the existing `BLANK_THREAD_LABEL`.

## How we’ll persist and rematerialize

In `[src/extension.ts](src/extension.ts)`:

- Update `persistThreadDoc(thread)` to save `selectedFirstLine` alongside the range + comments.
- Update `materializeForUri(uri)` to restore `thread.label` from stored `selectedFirstLine` (or `BLANK_THREAD_LABEL` for older threads).

## Clipboard export format change

In `formatClipboardExportForFile(uri)` in `[src/extension.ts](src/extension.ts)`:

- add a new line per thread, between Location and Comment:
  - `Selected: <selectedFirstLine>`
- if `selectedFirstLine` is missing/empty (older data), export   `Selected: (unknown)` or omit the line (we’ll implement one consistent behavior).

## Tests

- Update `[src/test/noteStore.test.ts](src/test/noteStore.test.ts)` typings/fixtures to allow the new optional field.
- Add/extend a focused unit test for the trimming helper (either colocated in `extension.ts` if feasible, or extracted to a small pure function module for testability).

## Example (new exported output)

Given a selection whose first line is:
`This is a very long selected heading that exceeds eighty characters and should be trimmed in export`

The exported section becomes:

- Location: L12-L14 (range0: [11:0..13:20])
Selected: This is a very long selected heading that exceeds eighty characters and should be trim
Comment: Consider splitting this into two paragraphs.

