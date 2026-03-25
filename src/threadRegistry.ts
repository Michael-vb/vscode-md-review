import * as vscode from 'vscode';

export class ThreadRegistry {
	private readonly threadToId = new WeakMap<vscode.CommentThread, string>();
	private readonly materialized = new Set<string>();
	private readonly keyToThread = new Map<string, vscode.CommentThread>();

	private static key(uri: vscode.Uri, threadId: string): string {
		return `${uri.toString()}\0${threadId}`;
	}

	register(thread: vscode.CommentThread, threadId: string, uri: vscode.Uri): void {
		this.threadToId.set(thread, threadId);
		const key = ThreadRegistry.key(uri, threadId);
		this.materialized.add(key);
		this.keyToThread.set(key, thread);
	}

	getId(thread: vscode.CommentThread): string | undefined {
		return this.threadToId.get(thread);
	}

	isMaterialized(uri: vscode.Uri, threadId: string): boolean {
		return this.materialized.has(ThreadRegistry.key(uri, threadId));
	}

	getThread(uri: vscode.Uri, threadId: string): vscode.CommentThread | undefined {
		return this.keyToThread.get(ThreadRegistry.key(uri, threadId));
	}

	getThreadsForUri(uri: vscode.Uri): vscode.CommentThread[] {
		const prefix = `${uri.toString()}\0`;
		const threads: vscode.CommentThread[] = [];
		for (const [k, thread] of this.keyToThread) {
			if (k.startsWith(prefix)) {
				threads.push(thread);
			}
		}
		return threads;
	}

	release(thread: vscode.CommentThread, uri: vscode.Uri): void {
		const id = this.threadToId.get(thread);
		if (id) {
			const key = ThreadRegistry.key(uri, id);
			this.materialized.delete(key);
			this.keyToThread.delete(key);
		}
		this.threadToId.delete(thread);
	}
}
