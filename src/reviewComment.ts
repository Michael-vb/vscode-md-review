import * as vscode from 'vscode';

/** Single-user reviews: no author label in the comment chrome. */
export const LOCAL_AUTHOR: vscode.CommentAuthorInformation = { name: '' };

export class ReviewComment implements vscode.Comment {
	readonly id: string;
	/** For persistence only; omitting `timestamp` on Comment hides time in the UI. */
	readonly createdAtMs: number;
	savedBody: string;

	constructor(
		public body: string | vscode.MarkdownString,
		public mode: vscode.CommentMode,
		public author: vscode.CommentAuthorInformation,
		public parent: vscode.CommentThread | undefined,
		public contextValue?: string,
		existingId?: string,
		createdAtMs?: number,
	) {
		this.id = existingId ?? crypto.randomUUID();
		this.createdAtMs = createdAtMs ?? Date.now();
		this.savedBody = typeof body === 'string' ? body : body.value;
	}
}

export function storedRangeToVSCode(stored: {
	readonly startLine: number;
	readonly startCharacter: number;
	readonly endLine: number;
	readonly endCharacter: number;
}): vscode.Range {
	return new vscode.Range(
		stored.startLine,
		stored.startCharacter,
		stored.endLine,
		stored.endCharacter,
	);
}

export function threadRangeToStored(range: vscode.Range): {
	readonly startLine: number;
	readonly startCharacter: number;
	readonly endLine: number;
	readonly endCharacter: number;
} {
	return {
		startLine: range.start.line,
		startCharacter: range.start.character,
		endLine: range.end.line,
		endCharacter: range.end.character,
	};
}
