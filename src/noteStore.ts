import * as vscode from 'vscode';

const STORAGE_KEY = 'markdownReview.threadsByFile';

export interface StoredComment {
	readonly id: string;
	readonly body: string;
	readonly createdAt: number;
}

export interface StoredThread {
	readonly threadId: string;
	readonly startLine: number;
	readonly startCharacter: number;
	readonly endLine: number;
	readonly endCharacter: number;
	readonly comments: StoredComment[];
}

export type ThreadsByFile = Record<string, StoredThread[]>;

export class NoteStore {
	constructor(private readonly workspaceState: vscode.Memento) {}

	getThreads(uri: vscode.Uri): StoredThread[] {
		const map = this.loadMap();
		return map[uri.toString()] ?? [];
	}

	saveThread(uri: vscode.Uri, thread: StoredThread): void {
		const map = this.loadMap();
		const key = uri.toString();
		const list = map[key] ?? [];
		const idx = list.findIndex((t) => t.threadId === thread.threadId);
		const next = idx === -1 ? [...list, thread] : list.map((t, i) => (i === idx ? thread : t));
		map[key] = next;
		void this.workspaceState.update(STORAGE_KEY, map);
	}

	deleteThread(uri: vscode.Uri, threadId: string): void {
		const map = this.loadMap();
		const key = uri.toString();
		const list = map[key];
		if (!list) {
			return;
		}
		const filtered = list.filter((t) => t.threadId !== threadId);
		if (filtered.length === 0) {
			delete map[key];
		} else {
			map[key] = filtered;
		}
		void this.workspaceState.update(STORAGE_KEY, map);
	}

	private loadMap(): ThreadsByFile {
		const raw = this.workspaceState.get<ThreadsByFile>(STORAGE_KEY);
		return raw && typeof raw === 'object' ? { ...raw } : {};
	}
}
