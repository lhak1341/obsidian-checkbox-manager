import type { CheckboxConfig } from './types';

/** Outcome of a list operation: the new list plus the Notice text on success, or why it was refused. Operations never mutate their input. */
export type ListResult =
	| { ok: true; list: CheckboxConfig[]; message: string }
	| { ok: false; reason: string };

/** The checkbox in `list` that already uses `symbol`, ignoring the one whose symbol is `exceptSymbol` (the checkbox being edited). */
export function findSymbolClash(list: CheckboxConfig[], symbol: string, exceptSymbol?: string): CheckboxConfig | undefined {
	return list.find((cb) => cb.symbol === symbol && cb.symbol !== exceptSymbol);
}

export function symbolClashMessage(symbol: string, clash: CheckboxConfig): string {
	return `Symbol "${symbol}" is already used by "${clash.name}"`;
}

/** Indices of the first two entries sharing a symbol, or undefined when every symbol is unique. The one detection used by add, edit, the form check (via findSymbolClash) and import. */
export function findDuplicateSymbol(list: readonly { symbol: string }[]): [first: number, second: number] | undefined {
	const firstIndexBySymbol = new Map<string, number>();
	for (let i = 0; i < list.length; i++) {
		const first = firstIndexBySymbol.get(list[i].symbol);
		if (first !== undefined) return [first, i];
		firstIndexBySymbol.set(list[i].symbol, i);
	}
	return undefined;
}

/** Appends `config`, refusing a symbol another checkbox already uses (css-generator keys its rules by symbol). */
export function addCheckbox(list: CheckboxConfig[], config: CheckboxConfig): ListResult {
	const clash = findSymbolClash(list, config.symbol);
	if (clash) return { ok: false, reason: symbolClashMessage(config.symbol, clash) };
	return { ok: true, list: [...list, config], message: `Added checkbox: [${config.symbol}] ${config.name}` };
}

/** Removes the checkbox with `symbol`. */
export function removeCheckbox(list: CheckboxConfig[], symbol: string): ListResult {
	const target = list.find((cb) => cb.symbol === symbol);
	if (!target) return { ok: false, reason: `No checkbox with symbol "${symbol}"` };
	return { ok: true, list: list.filter((cb) => cb !== target), message: `Deleted checkbox: ${target.name}` };
}

/** Replaces the checkbox with `symbol` in place; the new symbol may change, but not to one a different checkbox uses. */
export function updateCheckbox(list: CheckboxConfig[], symbol: string, config: CheckboxConfig): ListResult {
	const index = list.findIndex((cb) => cb.symbol === symbol);
	if (index === -1) return { ok: false, reason: `No checkbox with symbol "${symbol}"` };
	const clash = findSymbolClash(list, config.symbol, symbol);
	if (clash) return { ok: false, reason: symbolClashMessage(config.symbol, clash) };
	return { ok: true, list: list.map((cb, i) => (i === index ? config : cb)), message: `Updated checkbox: [${config.symbol}] ${config.name}` };
}

/** Moves the checkbox at `from` to `to`; refuses equal or out-of-range indices. */
export function reorderCheckboxes(list: CheckboxConfig[], from: number, to: number): ListResult {
	if (from === to || from < 0 || from >= list.length || to < 0 || to >= list.length) {
		return { ok: false, reason: 'Nothing to move' };
	}
	const result = [...list];
	const [moved] = result.splice(from, 1);
	result.splice(to, 0, moved);
	return { ok: true, list: result, message: `Moved "${moved.name}" to position ${to + 1}` };
}
