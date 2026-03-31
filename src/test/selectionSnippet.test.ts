import * as assert from 'assert';

import { firstLineSnippet } from '../selectionSnippet';

suite('firstLineSnippet', () => {
	test('returns trimmed first line', () => {
		assert.strictEqual(firstLineSnippet('  hello world  \nsecond'), 'hello world');
	});

	test('trims to 80 characters', () => {
		const input = `${'a'.repeat(120)}\nsecond`;
		const got = firstLineSnippet(input, 80);
		assert.strictEqual(got.length, 80);
		assert.strictEqual(got, 'a'.repeat(80));
	});
});

