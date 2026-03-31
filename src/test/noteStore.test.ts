import * as assert from 'assert';
import * as vscode from 'vscode';

import { NoteStore, type StoredThread } from '../noteStore';

class FakeMemento implements vscode.Memento {
	private readonly map = new Map<string, unknown>();

	keys(): readonly string[] {
		return [...this.map.keys()];
	}

	get<T>(key: string): T | undefined;
	get<T>(key: string, defaultValue: T): T;
	get<T>(key: string, defaultValue?: T): T | undefined {
		return this.map.has(key) ? (this.map.get(key) as T) : defaultValue;
	}

	update(key: string, value: unknown): Thenable<void> {
		this.map.set(key, value);
		return Promise.resolve();
	}
}

suite('NoteStore', () => {
	const uri = vscode.Uri.parse('file:///workspace/note.md');

	test('saveThread then getThreads returns thread', () => {
		const store = new NoteStore(new FakeMemento());
		const thread: StoredThread = {
			threadId: 't1',
			startLine: 0,
			startCharacter: 0,
			endLine: 0,
			endCharacter: 5,
			comments: [{ id: 'c1', body: 'hi', createdAt: 1 }],
		};
		store.saveThread(uri, thread);
		const got = store.getThreads(uri);
		assert.strictEqual(got.length, 1);
		assert.strictEqual(got[0].threadId, 't1');
		assert.strictEqual(got[0].comments[0].body, 'hi');
	});

	test('saveThread upserts by threadId', () => {
		const store = new NoteStore(new FakeMemento());
		const a: StoredThread = {
			threadId: 't1',
			startLine: 0,
			startCharacter: 0,
			endLine: 0,
			endCharacter: 1,
			comments: [],
		};
		const b: StoredThread = {
			threadId: 't1',
			startLine: 1,
			startCharacter: 0,
			endLine: 1,
			endCharacter: 2,
			comments: [{ id: 'c2', body: 'x', createdAt: 2 }],
		};
		store.saveThread(uri, a);
		store.saveThread(uri, b);
		const got = store.getThreads(uri);
		assert.strictEqual(got.length, 1);
		assert.strictEqual(got[0].startLine, 1);
		assert.strictEqual(got[0].comments[0].body, 'x');
	});

	test('deleteThread removes thread', () => {
		const store = new NoteStore(new FakeMemento());
		store.saveThread(uri, {
			threadId: 't1',
			startLine: 0,
			startCharacter: 0,
			endLine: 0,
			endCharacter: 1,
			comments: [],
		});
		store.deleteThread(uri, 't1');
		assert.strictEqual(store.getThreads(uri).length, 0);
	});

	test('listThreadUris returns only files with stored threads', () => {
		const store = new NoteStore(new FakeMemento());
		const a = vscode.Uri.parse('file:///workspace/a.md');
		const b = vscode.Uri.parse('file:///workspace/b.md');

		assert.deepStrictEqual(store.listThreadUris(), []);

		store.saveThread(a, {
			threadId: 't1',
			startLine: 0,
			startCharacter: 0,
			endLine: 0,
			endCharacter: 1,
			comments: [],
		});
		store.saveThread(b, {
			threadId: 't2',
			startLine: 0,
			startCharacter: 0,
			endLine: 0,
			endCharacter: 1,
			comments: [],
		});

		const got = store
			.listThreadUris()
			.map((u) => u.toString())
			.sort();
		assert.deepStrictEqual(got, [a.toString(), b.toString()].sort());

		store.deleteThread(a, 't1');
		const got2 = store
			.listThreadUris()
			.map((u) => u.toString())
			.sort();
		assert.deepStrictEqual(got2, [b.toString()]);
	});
});
