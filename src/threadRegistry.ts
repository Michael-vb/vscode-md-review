import * as vscode from 'vscode';

export class ThreadRegistry {
	private readonly threadToId = new WeakMap<vscode.CommentThread, string>();
	private readonly materialized = new Set<string>();

	private static key(uri: vscode.Uri, threadId: string): string {
		return `${uri.toString()}\0${threadId}`;
	}

	register(thread: vscode.CommentThread, threadId: string, uri: vscode.Uri): void {
		this.threadToId.set(thread, threadId);
		this.materialized.add(ThreadRegistry.key(uri, threadId));
	}

	getId(thread: vscode.CommentThread): string | undefined {
		return this.threadToId.get(thread);
	}

	isMaterialized(uri: vscode.Uri, threadId: string): boolean {
		return this.materialized.has(ThreadRegistry.key(uri, threadId));
	}

	release(thread: vscode.CommentThread, uri: vscode.Uri): void {
		const id = this.threadToId.get(thread);
		if (id) {
			this.materialized.delete(ThreadRegistry.key(uri, id));
		}
		this.threadToId.delete(thread);
	}
}
