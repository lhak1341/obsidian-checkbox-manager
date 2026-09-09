import { describe, expect, it } from 'vitest';
import { reorderCheckboxes } from './checkbox-reorder';
import type { CheckboxConfig } from './types';

function makeCheckbox(symbol: string): CheckboxConfig {
	return { symbol, name: symbol, color: 'red', icon: '', viewBox: '0 0 512 512', description: '' };
}

const LIST = ['a', 'b', 'c', 'd'].map(makeCheckbox);

describe('reorderCheckboxes', () => {
	it('moves an item earlier in the list', () => {
		const result = reorderCheckboxes(LIST, 2, 0);
		expect(result.map((cb) => cb.symbol)).toEqual(['c', 'a', 'b', 'd']);
	});

	it('moves an item later in the list', () => {
		const result = reorderCheckboxes(LIST, 0, 2);
		expect(result.map((cb) => cb.symbol)).toEqual(['b', 'c', 'a', 'd']);
	});

	it('does not mutate the input list', () => {
		const before = LIST.map((cb) => cb.symbol);
		reorderCheckboxes(LIST, 0, 2);
		expect(LIST.map((cb) => cb.symbol)).toEqual(before);
	});

	it('no-ops when from equals to', () => {
		const result = reorderCheckboxes(LIST, 1, 1);
		expect(result).toBe(LIST);
	});

	it('no-ops when from is out of range', () => {
		expect(reorderCheckboxes(LIST, -1, 0)).toBe(LIST);
		expect(reorderCheckboxes(LIST, LIST.length, 0)).toBe(LIST);
	});

	it('no-ops when to is out of range', () => {
		expect(reorderCheckboxes(LIST, 0, -1)).toBe(LIST);
		expect(reorderCheckboxes(LIST, 0, LIST.length)).toBe(LIST);
	});
});
