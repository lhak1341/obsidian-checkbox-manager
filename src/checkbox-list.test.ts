import { describe, expect, it } from 'vitest';
import { addCheckbox, findDuplicateSymbol, findSymbolClash, removeCheckbox, reorderCheckboxes, symbolClashMessage, updateCheckbox, type ListResult } from './checkbox-list';
import type { CheckboxConfig } from './types';

function makeCheckbox(symbol: string, overrides: Partial<CheckboxConfig> = {}): CheckboxConfig {
	return { symbol, name: symbol.toUpperCase(), color: 'red', icon: '', viewBox: '0 0 512 512', description: '', ...overrides };
}

const LIST = ['a', 'b', 'c', 'd'].map((s) => makeCheckbox(s));

function symbolsOf(result: ListResult): string[] {
	if (!result.ok) throw new Error(`expected ok, got: ${result.reason}`);
	return result.list.map((cb) => cb.symbol);
}

describe('findDuplicateSymbol', () => {
	it('returns undefined when every symbol is unique', () => {
		expect(findDuplicateSymbol(LIST)).toBeUndefined();
	});

	it('returns the indices of the first repeated symbol and its first occurrence', () => {
		const list = ['a', 'b', 'a', 'b'].map((s) => makeCheckbox(s));
		expect(findDuplicateSymbol(list)).toEqual([0, 2]);
	});
});

describe('findSymbolClash', () => {
	it('finds the checkbox already using the symbol', () => {
		expect(findSymbolClash(LIST, 'b')?.name).toBe('B');
	});

	it('returns undefined for a free symbol', () => {
		expect(findSymbolClash(LIST, 'z')).toBeUndefined();
	});

	it('ignores the checkbox being edited, identified by its original symbol', () => {
		expect(findSymbolClash(LIST, 'b', 'b')).toBeUndefined();
		expect(findSymbolClash(LIST, 'c', 'b')?.name).toBe('C');
	});

	it('words the clash with the other checkbox\'s name', () => {
		expect(symbolClashMessage('b', makeCheckbox('b'))).toBe('Symbol "b" is already used by "B"');
	});
});

describe('addCheckbox', () => {
	it('appends the new checkbox and reports it', () => {
		const result = addCheckbox(LIST, makeCheckbox('e', { name: 'Eagle' }));
		expect(symbolsOf(result)).toEqual(['a', 'b', 'c', 'd', 'e']);
		expect(result).toMatchObject({ ok: true, message: 'Added checkbox: [e] Eagle' });
	});

	it('refuses a symbol another checkbox already uses, naming it', () => {
		expect(addCheckbox(LIST, makeCheckbox('b'))).toEqual({ ok: false, reason: 'Symbol "b" is already used by "B"' });
	});

	it('does not mutate the input list', () => {
		addCheckbox(LIST, makeCheckbox('e'));
		expect(LIST).toHaveLength(4);
	});
});

describe('removeCheckbox', () => {
	it('removes the checkbox with that symbol and reports it', () => {
		const result = removeCheckbox(LIST, 'b');
		expect(symbolsOf(result)).toEqual(['a', 'c', 'd']);
		expect(result).toMatchObject({ ok: true, message: 'Deleted checkbox: B' });
	});

	it('refuses an unknown symbol', () => {
		expect(removeCheckbox(LIST, 'z')).toEqual({ ok: false, reason: 'No checkbox with symbol "z"' });
	});

	it('does not mutate the input list', () => {
		removeCheckbox(LIST, 'b');
		expect(LIST).toHaveLength(4);
	});
});

describe('updateCheckbox', () => {
	it('replaces the checkbox in place, keeping its position', () => {
		const result = updateCheckbox(LIST, 'b', makeCheckbox('b', { name: 'Bee' }));
		expect(symbolsOf(result)).toEqual(['a', 'b', 'c', 'd']);
		expect(result).toMatchObject({ ok: true, message: 'Updated checkbox: [b] Bee' });
		if (result.ok) expect(result.list[1].name).toBe('Bee');
	});

	it('allows changing the symbol to one nobody uses', () => {
		expect(symbolsOf(updateCheckbox(LIST, 'b', makeCheckbox('x')))).toEqual(['a', 'x', 'c', 'd']);
	});

	it('refuses a new symbol that collides with a different checkbox', () => {
		expect(updateCheckbox(LIST, 'b', makeCheckbox('c'))).toEqual({ ok: false, reason: 'Symbol "c" is already used by "C"' });
	});

	it('refuses an unknown symbol', () => {
		expect(updateCheckbox(LIST, 'z', makeCheckbox('z'))).toEqual({ ok: false, reason: 'No checkbox with symbol "z"' });
	});

	it('does not mutate the input list', () => {
		updateCheckbox(LIST, 'b', makeCheckbox('b', { name: 'Bee' }));
		expect(LIST[1].name).toBe('B');
	});
});

describe('reorderCheckboxes', () => {
	it('moves an item earlier in the list', () => {
		expect(symbolsOf(reorderCheckboxes(LIST, 2, 0))).toEqual(['c', 'a', 'b', 'd']);
	});

	it('moves an item later in the list and reports its 1-based position', () => {
		const result = reorderCheckboxes(LIST, 0, 2);
		expect(symbolsOf(result)).toEqual(['b', 'c', 'a', 'd']);
		expect(result).toMatchObject({ ok: true, message: 'Moved "A" to position 3' });
	});

	it('does not mutate the input list', () => {
		const before = LIST.map((cb) => cb.symbol);
		reorderCheckboxes(LIST, 0, 2);
		expect(LIST.map((cb) => cb.symbol)).toEqual(before);
	});

	it('refuses equal indices', () => {
		expect(reorderCheckboxes(LIST, 1, 1)).toEqual({ ok: false, reason: 'Nothing to move' });
	});

	it('refuses out-of-range indices', () => {
		expect(reorderCheckboxes(LIST, -1, 0).ok).toBe(false);
		expect(reorderCheckboxes(LIST, LIST.length, 0).ok).toBe(false);
		expect(reorderCheckboxes(LIST, 0, -1).ok).toBe(false);
		expect(reorderCheckboxes(LIST, 0, LIST.length).ok).toBe(false);
	});
});
