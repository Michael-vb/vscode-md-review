import * as vscode from 'vscode';

import { NoteStore, type StoredComment } from './noteStore';
import {
	LOCAL_AUTHOR,
	ReviewComment,
	storedRangeToVSCode,
	threadRangeToStored,
} from './reviewComment';
import { firstLineSnippet } from './selectionSnippet';
import { ThreadRegistry } from './threadRegistry';

const COMMENT_CONTROLLER_ID = 'markdownReview';

/** VS Code's thread header only updates when `label` is truthy; `''` leaves "Start discussion" stuck in the DOM. */
const BLANK_THREAD_LABEL = '\u200b';

export function activate(context: vscode.ExtensionContext): void {
	const store = new NoteStore(context.workspaceState);
	const registry = new ThreadRegistry();

	const commentController = vscode.comments.createCommentController(COMMENT_CONTROLLER_ID, 'Review');
	// `prompt: ''` avoids an extra caption; thread title uses BLANK_THREAD_LABEL (see const above).
	commentController.options = {
		prompt: '',
		placeHolder: 'Write a note…',
	};

	commentController.commentingRangeProvider = {
		provideCommentingRanges(document, _token) {
			if (document.languageId !== 'markdown') {
				return [];
			}
			const lineCount = document.lineCount;
			if (lineCount === 0) {
				return [];
			}
			const lastLine = document.lineAt(lineCount - 1);
			return [new vscode.Range(0, 0, lineCount - 1, lastLine.text.length)];
		},
	};

	context.subscriptions.push(commentController);

	function activeMarkdownUri(): vscode.Uri | undefined {
		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.document.languageId !== 'markdown') {
			return undefined;
		}
		return editor.document.uri;
	}

	function fileLabel(uri: vscode.Uri): string {
		const rel = vscode.workspace.asRelativePath(uri, false);
		// asRelativePath may fall back to an absolute-ish string; prefer a stable URI in that case.
		if (!rel || rel === uri.fsPath || rel.startsWith('..')) {
			return uri.toString();
		}
		return rel;
	}

	function formatClipboardExportForFile(uri: vscode.Uri, opts?: { includeHeader?: boolean }): string {
		const includeHeader = opts?.includeHeader ?? true;
		const threads = store
			.getThreads(uri)
			.slice()
			.sort((a, b) =>
				a.startLine !== b.startLine
					? a.startLine - b.startLine
					: a.startCharacter - b.startCharacter,
			);

		const lines: string[] = [];
		if (includeHeader) {
			lines.push(
				'Each comment is tied to a specific file and line/range. Make edits that satisfy every comment.',
			);
			lines.push('');
		}
		lines.push(`File: ${fileLabel(uri)}`);
		lines.push('');

		for (const t of threads) {
			const start1 = t.startLine + 1;
			const end1 = t.endLine + 1;
			const location = start1 === end1 ? `L${start1}` : `L${start1}-L${end1}`;
			const range0 = `[${t.startLine}:${t.startCharacter}..${t.endLine}:${t.endCharacter}]`;
			const body = t.comments[0]?.body?.trim() ?? '';
			const selected = t.selectedFirstLine;

			lines.push(`- Location: ${location} (range0: ${range0})`);
			lines.push(`  Selected: ${selected || '(unknown)'}`);
			lines.push(`  Comment: ${body || '(empty)'}`);
			lines.push('');
		}

		// Trim trailing blank line(s) for cleaner clipboard.
		while (lines.length > 0 && lines[lines.length - 1] === '') {
			lines.pop();
		}
		return `${lines.join('\n')}\n`;
	}

	function formatClipboardExportForWorkspace(): { text: string; uris: vscode.Uri[] } {
		const uris = store
			.listThreadUris()
			.slice()
			.sort((a, b) => fileLabel(a).localeCompare(fileLabel(b)));

		if (uris.length === 0) {
			return { text: '', uris: [] };
		}

		const chunks: string[] = [];
		for (let i = 0; i < uris.length; i++) {
			const uri = uris[i]!;
			chunks.push(formatClipboardExportForFile(uri, { includeHeader: i === 0 }));
		}

		return { text: chunks.join('\n---\n\n'), uris };
	}

	async function copyFileReviewToClipboard(uri: vscode.Uri): Promise<void> {
		const text = formatClipboardExportForFile(uri);
		await vscode.env.clipboard.writeText(text);
	}

	async function copyAndCleanFileReview(uri: vscode.Uri): Promise<void> {
		await copyFileReviewToClipboard(uri);

		// Clean: remove all stored threads for this file.
		for (const t of store.getThreads(uri)) {
			store.deleteThread(uri, t.threadId);
		}

		// Also dispose any materialized threads currently visible for this URI.
		for (const thread of registry.getThreadsForUri(uri)) {
			registry.release(thread, uri);
			thread.dispose();
		}
	}

	function ensureThreadId(thread: vscode.CommentThread): string {
		const existing = registry.getId(thread);
		if (existing) {
			return existing;
		}
		const id = crypto.randomUUID();
		registry.register(thread, id, thread.uri);
		return id;
	}

	function applyReviewThreadDefaults(thread: vscode.CommentThread): void {
		thread.canReply = false;
		if (!thread.label) {
			thread.label = BLANK_THREAD_LABEL;
		}
	}

	function persistThreadDoc(thread: vscode.CommentThread): void {
		const id = registry.getId(thread);
		if (!id || !thread.range) {
			return;
		}
		const mapped: StoredComment[] = thread.comments.map((c) => {
			const rc = c as ReviewComment;
			return {
				id: rc.id,
				body: typeof c.body === 'string' ? c.body : c.body.value,
				createdAt: rc.createdAtMs,
			};
		});
		const comments = mapped.slice(0, 1);
		const selectedFirstLine =
			thread.label && thread.label !== BLANK_THREAD_LABEL ? thread.label : undefined;
		store.saveThread(thread.uri, {
			threadId: id,
			...threadRangeToStored(thread.range),
			selectedFirstLine,
			comments,
		});
	}

	function materializeForUri(uri: vscode.Uri): void {
		const doc = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
		if (!doc || doc.languageId !== 'markdown') {
			return;
		}
		for (const stored of store.getThreads(uri)) {
			if (registry.isMaterialized(uri, stored.threadId)) {
				continue;
			}
			const range = storedRangeToVSCode(stored);
			const thread = commentController.createCommentThread(uri, range, []);
			applyReviewThreadDefaults(thread);
			thread.label = stored.selectedFirstLine ? stored.selectedFirstLine : BLANK_THREAD_LABEL;
			const first = stored.comments[0];
			const comments = first
				? [
						new ReviewComment(
							first.body,
							vscode.CommentMode.Preview,
							LOCAL_AUTHOR,
							thread,
							'canDelete',
							first.id,
							first.createdAt,
						),
					]
				: [];
			thread.comments = comments;
			thread.collapsibleState = vscode.CommentThreadCollapsibleState.Collapsed;
			registry.register(thread, stored.threadId, uri);
		}
	}

	function computeSelectedFirstLine(thread: vscode.CommentThread): string | undefined {
		if (thread.label && thread.label !== BLANK_THREAD_LABEL) {
			return thread.label;
		}
		const range = thread.range;
		if (!range) {
			return undefined;
		}
		const doc = vscode.workspace.textDocuments.find(
			(d) => d.uri.toString() === thread.uri.toString(),
		);
		if (!doc) {
			return undefined;
		}
		const selectedText = doc.getText(range);
		if (selectedText) {
			const snippet = firstLineSnippet(selectedText, 80);
			return snippet || undefined;
		}

		// VS Code may create threads with an empty range (cursor position).
		// In that case, fall back to the whole line at the anchor line.
		if (range.start.line >= 0 && range.start.line < doc.lineCount) {
			const lineText = doc.lineAt(range.start.line).text;
			const snippet = firstLineSnippet(lineText, 80);
			return snippet || undefined;
		}

		return undefined;
	}

	/** Single note per review: first submit only (no replies). */
	function submitFirstNote(reply: vscode.CommentReply): void {
		const thread = reply.thread;
		if (thread.comments.length > 0) {
			return;
		}
		const snippet = computeSelectedFirstLine(thread);
		if (snippet) {
			thread.label = snippet;
		}
		ensureThreadId(thread);
		const newComment = new ReviewComment(
			reply.text,
			vscode.CommentMode.Preview,
			LOCAL_AUTHOR,
			thread,
			'canDelete',
		);
		thread.comments = [newComment];
		applyReviewThreadDefaults(thread);
		persistThreadDoc(thread);
	}

	function deleteNote(thread: vscode.CommentThread): void {
		const id = registry.getId(thread);
		if (id) {
			store.deleteThread(thread.uri, id);
		}
		registry.release(thread, thread.uri);
		thread.dispose();
	}

	function deleteNoteComment(comment: ReviewComment): void {
		const thread = comment.parent;
		if (!thread) {
			return;
		}
		thread.comments = thread.comments.filter((c) => (c as ReviewComment).id !== comment.id);
		if (thread.comments.length === 0) {
			deleteNote(thread);
		} else {
			persistThreadDoc(thread);
		}
	}

	function editNote(comment: ReviewComment): void {
		if (!comment.parent) {
			return;
		}
		comment.parent.comments = comment.parent.comments.map((cmt) => {
			if ((cmt as ReviewComment).id === comment.id) {
				cmt.mode = vscode.CommentMode.Editing;
			}
			return cmt;
		});
	}

	function saveNote(comment: ReviewComment): void {
		if (!comment.parent) {
			return;
		}
		comment.parent.comments = comment.parent.comments.map((cmt) => {
			if ((cmt as ReviewComment).id === comment.id) {
				const rc = cmt as ReviewComment;
				rc.savedBody = typeof cmt.body === 'string' ? cmt.body : cmt.body.value;
				cmt.mode = vscode.CommentMode.Preview;
			}
			return cmt;
		});
		persistThreadDoc(comment.parent);
	}

	function cancelSaveNote(comment: ReviewComment): void {
		if (!comment.parent) {
			return;
		}
		comment.parent.comments = comment.parent.comments.map((cmt) => {
			if ((cmt as ReviewComment).id === comment.id) {
				cmt.body = (cmt as ReviewComment).savedBody;
				cmt.mode = vscode.CommentMode.Preview;
			}
			return cmt;
		});
		persistThreadDoc(comment.parent);
	}

	const addComment = (): void => {
		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.document.languageId !== 'markdown') {
			void vscode.window.showInformationMessage('Open a Markdown file to add a review comment.');
			return;
		}
		if (editor.selection.isEmpty) {
			void vscode.window.showInformationMessage('Select some text to attach a comment.');
			return;
		}
		const threadId = crypto.randomUUID();
		const thread = commentController.createCommentThread(
			editor.document.uri,
			editor.selection,
			[],
		);
		const snippet = computeSelectedFirstLine(thread);
		if (snippet) {
			thread.label = snippet;
		}
		applyReviewThreadDefaults(thread);
		thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;
		registry.register(thread, threadId, editor.document.uri);
		persistThreadDoc(thread);
	};

	context.subscriptions.push(
		vscode.commands.registerCommand('markdownReview.createNote', (reply: vscode.CommentReply) => {
			submitFirstNote(reply);
		}),
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('markdownReview.deleteNote', (thread: vscode.CommentThread) => {
			deleteNote(thread);
		}),
	);
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'markdownReview.deleteNoteComment',
			(comment: ReviewComment) => {
				deleteNoteComment(comment);
			},
		),
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('markdownReview.editNote', (comment: ReviewComment) => {
			editNote(comment);
		}),
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('markdownReview.saveNote', (comment: ReviewComment) => {
			saveNote(comment);
		}),
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('markdownReview.cancelSaveNote', (comment: ReviewComment) => {
			cancelSaveNote(comment);
		}),
	);
	context.subscriptions.push(vscode.commands.registerCommand('markdownReview.addComment', addComment));

	context.subscriptions.push(
		vscode.commands.registerCommand('markdownReview.copy', async () => {
			const exported = formatClipboardExportForWorkspace();
			if (!exported.text) {
				void vscode.window.showInformationMessage('No stored review notes to copy.');
				return;
			}
			await vscode.env.clipboard.writeText(exported.text);
			void vscode.window.showInformationMessage(
				`Copied review notes for ${exported.uris.length} file(s) to clipboard.`,
			);
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('markdownReview.copyAndClean', async () => {
			const exported = formatClipboardExportForWorkspace();
			if (!exported.text) {
				void vscode.window.showInformationMessage('No stored review notes to copy.');
				return;
			}

			await vscode.env.clipboard.writeText(exported.text);

			for (const uri of exported.uris) {
				for (const t of store.getThreads(uri)) {
					store.deleteThread(uri, t.threadId);
				}
				for (const thread of registry.getThreadsForUri(uri)) {
					registry.release(thread, uri);
					thread.dispose();
				}
			}

			void vscode.window.showInformationMessage(
				`Copied review notes and cleaned ${exported.uris.length} file(s).`,
			);
		}),
	);

	for (const doc of vscode.workspace.textDocuments) {
		if (doc.languageId === 'markdown') {
			materializeForUri(doc.uri);
		}
	}

	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument((d) => {
			if (d.languageId === 'markdown') {
				materializeForUri(d.uri);
			}
		}),
	);
}

export function deactivate(): void {}
