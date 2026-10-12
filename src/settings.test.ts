import { describe, expect, it } from 'vitest';
import { importSettings, normalizeSettings, resetCheckboxes, setEnabled, setIconPosition, setIconSize, type SettingsResult } from './settings';
import { DEFAULT_CHECKBOXES, DEFAULT_SETTINGS } from './defaults';
import type { CheckboxConfig, PluginSettings } from './types';

function makeCheckbox(overrides: Partial<CheckboxConfig> = {}): CheckboxConfig {
	return {
		symbol: 'z',
		name: 'Custom',
		color: 'var(--color-blue)',
		icon: 'M1 1',
		viewBox: '0 0 512 512',
		description: '',
		...overrides,
	};
}

describe('normalizeSettings', () => {
	it('returns defaults for null or undefined input', () => {
		expect(normalizeSettings(null).checkboxes).toEqual(DEFAULT_CHECKBOXES);
		expect(normalizeSettings(undefined).iconStyle).toBe('stroke');
	});

	it('fills a missing viewBox with the filled default', () => {
		const out = normalizeSettings({ checkboxes: [makeCheckbox({ viewBox: '' })] });
		expect(out.checkboxes[0].viewBox).toBe('0 0 512 512');
	});

	it('backfills customIconData from the default with the same symbol', () => {
		const bang = DEFAULT_CHECKBOXES.find((d) => d.symbol === '!')!;
		const out = normalizeSettings({ checkboxes: [makeCheckbox({ symbol: '!', customIconData: undefined })] });
		expect(out.checkboxes[0].customIconData).toEqual(bang.customIconData);
	});

	it('leaves customIconData absent when no default shares the symbol', () => {
		const out = normalizeSettings({ checkboxes: [makeCheckbox({ symbol: 'z' })] });
		expect(out.checkboxes[0].customIconData).toBeUndefined();
	});

	it('keeps an existing customIconData', () => {
		const own = { viewBox: '0 0 24 24', elements: ['<path d="M0 0"/>'] };
		const out = normalizeSettings({ checkboxes: [makeCheckbox({ symbol: '!', customIconData: own })] });
		expect(out.checkboxes[0].customIconData).toEqual(own);
	});

	it('converts legacy customIconData paths into elements', () => {
		const legacy = { viewBox: '0 0 24 24', paths: ['M1 1', 'M2 2'] } as unknown as CheckboxConfig['customIconData'];
		const out = normalizeSettings({ checkboxes: [makeCheckbox({ customIconData: legacy })] });
		expect(out.checkboxes[0].customIconData).toEqual({ viewBox: '0 0 24 24', elements: ['<path d="M1 1"/>', '<path d="M2 2"/>'] });
	});

	it('prefers elements over paths when both are present', () => {
		const both = { viewBox: '0 0 24 24', paths: ['M1 1'], elements: ['<circle/>'] } as unknown as CheckboxConfig['customIconData'];
		const out = normalizeSettings({ checkboxes: [makeCheckbox({ customIconData: both })] });
		expect(out.checkboxes[0].customIconData).toEqual({ viewBox: '0 0 24 24', elements: ['<circle/>'] });
	});

	it('defaults a missing iconStyle to stroke', () => {
		const out = normalizeSettings({ iconStyle: undefined });
		expect(out.iconStyle).toBe('stroke');
	});

	it('does not mutate its input or share backfilled objects with the defaults', () => {
		const input = { checkboxes: [makeCheckbox({ symbol: '!', customIconData: undefined })] };
		const out = normalizeSettings(input);
		expect(input.checkboxes[0].customIconData).toBeUndefined();
		const bang = DEFAULT_CHECKBOXES.find((d) => d.symbol === '!')!;
		expect(out.checkboxes[0].customIconData).not.toBe(bang.customIconData);
	});
});

function settingsOf(result: SettingsResult): PluginSettings {
	if (!result.ok) throw new Error(`expected ok, got: ${result.reason}`);
	return result.settings;
}

describe('resetCheckboxes', () => {
	it('restores the default checkboxes and keeps every other setting', () => {
		const settings: PluginSettings = { ...DEFAULT_SETTINGS, checkboxes: [makeCheckbox()], iconSize: '50%', enabled: false };
		const out = settingsOf(resetCheckboxes(settings));
		expect(out.checkboxes).toEqual(DEFAULT_CHECKBOXES);
		expect(out.iconSize).toBe('50%');
		expect(out.enabled).toBe(false);
	});

	it('returns deep copies, so mutating the result leaves the defaults intact', () => {
		const out = settingsOf(resetCheckboxes(DEFAULT_SETTINGS));
		out.checkboxes[0].name = 'changed';
		expect(DEFAULT_CHECKBOXES[0].name).not.toBe('changed');
	});

	it('carries the Notice text', () => {
		expect(resetCheckboxes(DEFAULT_SETTINGS)).toMatchObject({ message: 'Checkbox configurations reset to defaults' });
	});
});

describe('importSettings', () => {
	it('takes the imported settings and reports the checkbox count', () => {
		const imported: PluginSettings = { ...DEFAULT_SETTINGS, iconSize: '12px' };
		expect(importSettings(imported, 7)).toEqual({ ok: true, settings: imported, message: 'Successfully imported 7 checkbox configurations!' });
	});
});

describe('setEnabled', () => {
	it('sets the flag, leaves other settings alone, and names the new state', () => {
		const on = setEnabled({ ...DEFAULT_SETTINGS, enabled: false, iconSize: '5px' }, true);
		expect(settingsOf(on)).toMatchObject({ enabled: true, iconSize: '5px' });
		expect(on).toMatchObject({ message: 'Custom checkboxes enabled' });
		expect(setEnabled(DEFAULT_SETTINGS, false)).toMatchObject({ message: 'Custom checkboxes disabled' });
	});

	it('does not mutate its input', () => {
		const input = { ...DEFAULT_SETTINGS, enabled: true };
		setEnabled(input, false);
		expect(input.enabled).toBe(true);
	});
});

describe('setIconSize / setIconPosition', () => {
	it('store the given value silently', () => {
		const size = setIconSize(DEFAULT_SETTINGS, '16px');
		expect(settingsOf(size).iconSize).toBe('16px');
		expect(size).not.toHaveProperty('message');
		expect(settingsOf(setIconPosition(DEFAULT_SETTINGS, 'center')).iconPosition).toBe('center');
	});

	it('fall back to the defaults on empty input', () => {
		const custom = { ...DEFAULT_SETTINGS, iconSize: '1px', iconPosition: 'top' };
		expect(settingsOf(setIconSize(custom, '')).iconSize).toBe(DEFAULT_SETTINGS.iconSize);
		expect(settingsOf(setIconPosition(custom, '')).iconPosition).toBe(DEFAULT_SETTINGS.iconPosition);
	});
});
