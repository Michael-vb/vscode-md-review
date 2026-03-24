import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	test('extension activates', async () => {
		const ext = vscode.extensions.getExtension('xMIkeXeeioi.vscode-md-review');
		assert.ok(ext);
		await assert.doesNotReject(async () => {
			await ext!.activate();
		});
	});
});
