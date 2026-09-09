import { describe, expect, it } from 'vitest';
import { buildCheckboxConfig, describeValidity } from './checkbox-config-form';
import type { CheckboxConfig } from './types';

describe('describeValidity', () => {
	it('is valid when symbol, name, and icon are all present', () => {
		expect(describeValidity('!', 'Important', true)).toEqual({ ok: true });
	});

	it('lists every missing field', () => {
		expect(describeValidity('', '', false)).toEqual({ ok: false, missing: ['symbol', 'name', 'icon'] });
	});

	it('lists only the fields that are missing', () => {
		expect(describeValidity('!', '', true)).toEqual({ ok: false, missing: ['name'] });
	});
});

const EXISTING: CheckboxConfig = {
	symbol: '!',
	name: 'Important',
	color: 'red',
	icon: 'M1 1',
	viewBox: '0 0 512 512',
	customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M2 2"/>'] },
	description: 'existing',
};

describe('buildCheckboxConfig', () => {
	it('assembles a new config from filled form fields, trimmed', () => {
		const result = buildCheckboxConfig(null, { symbol: ' ! ', name: ' Important ', color: ' red ' }, { icon: ' M1 1 ', viewBox: ' 0 0 512 512 ' });

		expect(result).toEqual({
			symbol: '!',
			name: 'Important',
			color: 'red',
			description: '',
			icon: 'M1 1',
			viewBox: '0 0 512 512',
			customIconData: undefined,
		});
	});

	it('falls back to the default viewBox when the filled viewBox is blank', () => {
		const result = buildCheckboxConfig(null, { symbol: '!', name: 'Important', color: 'red' }, { icon: 'M1 1', viewBox: '  ' });

		expect(result.viewBox).toBe('0 0 512 512');
	});

	it('preserves the filled representation when editing while style is stroke', () => {
		const result = buildCheckboxConfig(EXISTING, { symbol: '!', name: 'Important', color: 'red' }, { customIconData: { viewBox: '0 0 24 24', elements: ['<circle/>'] } });

		expect(result.icon).toBe(EXISTING.icon);
		expect(result.viewBox).toBe(EXISTING.viewBox);
		expect(result.customIconData).toEqual({ viewBox: '0 0 24 24', elements: ['<circle/>'] });
	});

	it('preserves the stroke representation when editing while style is filled', () => {
		const result = buildCheckboxConfig(EXISTING, { symbol: '!', name: 'Important', color: 'red' }, { icon: 'M9 9', viewBox: '0 0 512 512' });

		expect(result.customIconData).toBe(EXISTING.customIconData);
		expect(result.icon).toBe('M9 9');
	});

	it('clears customIconData when the stroke value has none', () => {
		const result = buildCheckboxConfig(EXISTING, { symbol: '!', name: 'Important', color: 'red' }, { customIconData: null });

		expect(result.customIconData).toBeUndefined();
	});

	it('preserves the existing description, which the form never edits', () => {
		const result = buildCheckboxConfig(EXISTING, { symbol: '!', name: 'Important', color: 'red' }, { icon: 'M9 9', viewBox: '0 0 512 512' });

		expect(result.description).toBe('existing');
	});
});
