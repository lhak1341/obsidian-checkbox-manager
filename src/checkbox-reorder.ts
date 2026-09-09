import type { CheckboxConfig } from './types';

/** Moves the checkbox at `from` to `to`, returning a new array. No-ops (returns `list` unchanged) on equal or out-of-range indices. */
export function reorderCheckboxes(list: CheckboxConfig[], from: number, to: number): CheckboxConfig[] {
	if (from === to || from < 0 || from >= list.length || to < 0 || to >= list.length) return list;

	const result = [...list];
	const [moved] = result.splice(from, 1);
	result.splice(to, 0, moved);
	return result;
}
