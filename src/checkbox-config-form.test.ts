import { describe, expect, it } from 'vitest';
import { COLOR_OPTIONS, evaluateForm, type FormInput } from './checkbox-config-form';
import { iconsFor } from './icon';
import type { CheckboxConfig } from './types';

const OTHER: CheckboxConfig = { symbol: '?', name: 'Question', color: 'red', icon: '', viewBox: '0 0 512 512', description: '' };

const EXISTING: CheckboxConfig = {
	symbol: '!',
	name: 'Important',
	color: 'red',
	icon: 'M1 1',
	viewBox: '0 0 512 512',
	customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M2 2"/>'] },
	description: 'existing',
};

const STROKE_FIELDS = { customIconData: { viewBox: '0 0 24 24', elements: ['<circle/>'] } };

function input(overrides: Partial<FormInput> = {}): FormInput {
	return {
		existing: null,
		form: { symbol: '!', name: 'Important', color: 'red' },
		iconFields: STROKE_FIELDS,
		icons: iconsFor('stroke'),
		checkboxes: [OTHER],
		...overrides,
	};
}

describe('evaluateForm — missing fields', () => {
	it('lists every missing field', () => {
		const result = evaluateForm(input({ form: { symbol: '', name: '', color: 'red' }, iconFields: {} }));
		expect(result).toEqual({ ok: false, message: 'Missing: symbol, name, icon' });
	});

	it('lists only the fields that are missing', () => {
		expect(evaluateForm(input({ form: { symbol: '!', name: '', color: 'red' } }))).toEqual({ ok: false, message: 'Missing: name' });
	});

	it('treats a whitespace-only symbol or name as missing', () => {
		const result = evaluateForm(input({ form: { symbol: '  ', name: ' ', color: 'red' } }));
		expect(result).toEqual({ ok: false, message: 'Missing: symbol, name' });
	});

	it('treats an empty icon (no drawable elements) as missing', () => {
		const result = evaluateForm(input({ iconFields: { customIconData: { viewBox: '0 0 24 24', elements: [] } } }));
		expect(result).toEqual({ ok: false, message: 'Missing: icon' });
	});

	it('judges the icon by the active style only', () => {
		const result = evaluateForm(input({ icons: iconsFor('filled'), iconFields: STROKE_FIELDS }));
		expect(result).toEqual({ ok: false, message: 'Missing: icon' });
	});
});

describe('evaluateForm — symbol collision', () => {
	it('refuses a symbol another checkbox uses, naming it', () => {
		const result = evaluateForm(input({ form: { symbol: '?', name: 'x', color: 'red' } }));
		expect(result).toEqual({ ok: false, message: 'Symbol "?" is already used by "Question"' });
	});

	it('checks the trimmed symbol', () => {
		const result = evaluateForm(input({ form: { symbol: ' ? ', name: 'x', color: 'red' } }));
		expect(result.ok).toBe(false);
	});

	it('lets an edited checkbox keep its own symbol', () => {
		const result = evaluateForm(input({ existing: EXISTING, checkboxes: [EXISTING, OTHER], form: { symbol: '!', name: 'Important', color: 'red' } }));
		expect(result.ok).toBe(true);
	});

	it('refuses an edit that takes a different checkbox\'s symbol', () => {
		const result = evaluateForm(input({ existing: EXISTING, checkboxes: [EXISTING, OTHER], form: { symbol: '?', name: 'Important', color: 'red' } }));
		expect(result).toEqual({ ok: false, message: 'Symbol "?" is already used by "Question"' });
	});

	it('reports missing fields before a collision', () => {
		const result = evaluateForm(input({ form: { symbol: '?', name: '', color: 'red' } }));
		expect(result).toEqual({ ok: false, message: 'Missing: name' });
	});
});

describe('evaluateForm — assembled config', () => {
	it('assembles a new config from stroke fields, with every text field trimmed', () => {
		const result = evaluateForm(input({ form: { symbol: ' ! ', name: ' Important ', color: ' red ' } }));

		expect(result).toEqual({
			ok: true,
			config: {
				symbol: '!',
				name: 'Important',
				color: 'red',
				description: '',
				icon: '',
				viewBox: '0 0 512 512',
				customIconData: STROKE_FIELDS.customIconData,
			},
		});
	});

	it('assembles a new config from filled fields, trimmed', () => {
		const result = evaluateForm(input({ icons: iconsFor('filled'), iconFields: { icon: ' M1 1 ', viewBox: ' 0 0 640 640 ' } }));

		expect(result.ok && result.config).toMatchObject({ icon: 'M1 1', viewBox: '0 0 640 640', customIconData: undefined });
	});

	it('falls back to the default viewBox when the filled viewBox is blank', () => {
		const result = evaluateForm(input({ icons: iconsFor('filled'), iconFields: { icon: 'M1 1', viewBox: '  ' } }));

		expect(result.ok && result.config.viewBox).toBe('0 0 512 512');
	});

	it('preserves the filled representation when editing while style is stroke', () => {
		const result = evaluateForm(input({ existing: EXISTING, checkboxes: [EXISTING] }));

		expect(result.ok && result.config).toMatchObject({ icon: EXISTING.icon, viewBox: EXISTING.viewBox, customIconData: STROKE_FIELDS.customIconData });
	});

	it('preserves the stroke representation when editing while style is filled', () => {
		const result = evaluateForm(input({ existing: EXISTING, checkboxes: [EXISTING], icons: iconsFor('filled'), iconFields: { icon: 'M9 9', viewBox: '0 0 512 512' } }));

		expect(result.ok && result.config.customIconData).toBe(EXISTING.customIconData);
		expect(result.ok && result.config.icon).toBe('M9 9');
	});

	it('preserves the existing description, which the form never edits', () => {
		const result = evaluateForm(input({ existing: EXISTING, checkboxes: [EXISTING] }));

		expect(result.ok && result.config.description).toBe('existing');
	});
});

describe('COLOR_OPTIONS', () => {
	it('starts with orange, the default for a new checkbox', () => {
		expect(COLOR_OPTIONS[0]).toEqual({ value: 'var(--color-orange)', label: 'Orange' });
	});

	it('has no duplicate values', () => {
		expect(new Set(COLOR_OPTIONS.map((o) => o.value)).size).toBe(COLOR_OPTIONS.length);
	});
});
