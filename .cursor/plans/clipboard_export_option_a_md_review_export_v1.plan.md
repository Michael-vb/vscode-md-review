---
name: clipboard export format (Option A)
overview: "Define a human- and agent-friendly clipboard format for exporting Markdown review comments grouped by file, preserving exact line/range metadata so an AI can apply edits reliably."
todos:
  - id: format
    content: Specify the Markdown Review Export v1 structure and fields
    status: completed
  - id: examples
    content: Provide an example with multiple comments on different lines
    status: completed
  - id: decisions
    content: List open decisions (paths vs URIs, line numbering, include snippet)
    status: completed
isProject: false
---

## Goal

When a review is finished, export **all comments for a file** into a single clipboard payload that:

- Is easy to read in chat.
- Is easy for an AI agent to parse.
- Preserves enough location info to apply edits (file + line/range).

## AI instructions (must appear at top of clipboard text)

The exported text should start with a short instruction block that tells the AI what to do.

Required instruction text:

```text
Each comment is tied to a specific file and line/range. Make edits that satisfy every comment.
```

Notes:

- Keep it short; avoid subjective “tone” guidance unless explicitly needed.
- Prefer actionable edit directives.

## Format

### File section

Each file gets a section. Comments are grouped under their file.

Required fields per file:

- **File**: a workspace-relative path if available (preferred), otherwise a URI string.

### Comment item

Each comment is a bullet item that includes:

- **Location**: 1-based line number(s) for readability.
- **Range**: the exact stored range in 0-based coordinates to remove ambiguity.
- **Comment**: the user’s requested change text.

Use `Comment:` (not `Request:`) as the label.

## Example (multiple comments for different lines in one Markdown file)

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

## Field definitions

- **Location**:
  - Use 1-based line numbers as `L<start>` or `L<start>-L<end>`.
  - This is for readability only; the authoritative position is `range0`.
- **range0**:
  - Always 0-based, inclusive start / exclusive end, mirroring VS Code `Range`.
  - Syntax: `[startLine:startCharacter..endLine:endCharacter]`
  - Example: `[11:0..11:42]` means `startLine=11,startCharacter=0,endLine=11,endCharacter=42`.
- **Comment**:
  - The freeform instruction to the AI (what to change and how).

## Open decisions

- **Paths vs URIs**:
  - Preferred: workspace-relative `File: docs/guide.md`
  - Fallback: `File: file:///abs/path/docs/guide.md` (or stored `uri.toString()` value)
- **Include snippet**:
  - Optional: include a short `Snippet:` line containing the selected text to help when the file drifted after review.
- **Sorting**:
  - Recommended: sort comments within a file by `(startLine,startCharacter)` ascending.

## UI: file-level copy buttons (not comment-level)

During review, the user is reviewing the **file**, not individual comments. The copy actions must be available as a **single click** at the file level and must copy **all stored comments for the current file**.

### Buttons / commands

Provide exactly two actions:

- **Copy**: Export all comments for the active Markdown file to clipboard.
- **Copy & Clean**: Export all comments for the active Markdown file to clipboard, then delete/clear those comments for that file.

### Placement

Add both actions to the editor title bar (top-right), visible for Markdown files:

- `contributes.menus["editor/title"]`
- `when: editorLangId == markdown`

This ensures the actions are visible while reviewing/editing the file, independent of which comment thread is focused.

