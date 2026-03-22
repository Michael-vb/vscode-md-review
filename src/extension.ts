import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
	const disposable = vscode.commands.registerCommand('markdownReview.hello', () => {
		// Status bar (not a blocking notification) so tests and automation do not hang.
		vscode.window.setStatusBarMessage('Markdown Review extension is working.', 5000);
	});
	context.subscriptions.push(disposable);
}

export function deactivate(): void {}
