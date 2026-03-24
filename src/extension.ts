import * as vscode from 'vscode';

import { NoteStore, type StoredComment } from './noteStore';
import {
	LOCAL_AUTHOR,
	ReviewComment,
	storedRangeToVSCode,
	threadRangeToStored,
} from './reviewComment';
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
		thread.label = BLANK_THREAD_LABEL;
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
		store.saveThread(thread.uri, {
			threadId: id,
			...threadRangeToStored(thread.range),
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

	/** Single note per review: first submit only (no replies). */
	function submitFirstNote(reply: vscode.CommentReply): void {
		const thread = reply.thread;
		if (thread.comments.length > 0) {
			return;
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
