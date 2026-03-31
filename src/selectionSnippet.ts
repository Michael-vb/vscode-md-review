export function firstLineSnippet(text: string, maxLen = 80): string {
	const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
	const trimmed = firstLine.trim();
	if (trimmed.length <= maxLen) {
		return trimmed;
	}
	return trimmed.slice(0, maxLen);
}

