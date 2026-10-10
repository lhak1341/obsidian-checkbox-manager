// A leading blockquote/callout prefix plus indent, e.g. "> > " or "\t".
const PREFIX_RE = /^(?:\s*>)*\s*/;
// A list marker only counts when whitespace (or end of line) follows, so "**bold**", "-5", "3.14" and "---" stay plain text.
const MARKER_RE = /^([-*+]|\d+[.)])(?:\s+|$)/;
// An existing task box: exactly one character in brackets, then whitespace or end of line.
const TASK_BOX_RE = /^\[.\](?:\s+|$)/;

/**
 * Rewrites a markdown line so it is a task with the given checkbox symbol: replaces the symbol of
 * an existing task, keeps an existing list marker (bullet or number), and otherwise prepends "- ".
 * Indent and any blockquote/callout prefix are preserved.
 */
export function setCheckbox(line: string, symbol: string): string {
	const prefix = PREFIX_RE.exec(line)![0];
	let rest = line.slice(prefix.length);
	let marker = '- ';

	const markerMatch = MARKER_RE.exec(rest);
	if (markerMatch) {
		marker = `${markerMatch[1]} `;
		rest = rest.slice(markerMatch[0].length);
		const taskBox = TASK_BOX_RE.exec(rest);
		if (taskBox) rest = rest.slice(taskBox[0].length);
	}

	return `${prefix}${marker}[${symbol}] ${rest}`;
}
