import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	test('markdownReview.hello command runs', async () => {
		// Activates extension (onCommand) and executes handler; must not throw.
		await assert.doesNotReject(async () => {
			await vscode.commands.executeCommand('markdownReview.hello');
		});
	});
});
