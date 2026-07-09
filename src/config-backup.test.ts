import { describe, expect, it } from 'vitest';
import { deserializeConfig, serializeConfig, suggestFilename } from './config-backup';
import type { CheckboxConfig, PluginSettings } from './types';

function makeCheckbox(overrides: Partial<CheckboxConfig> = {}): CheckboxConfig {
	return {
		symbol: '!',
		name: 'Important',
		color: 'var(--color-orange)',
		icon: 'M1 1',
		viewBox: '0 0 512 512',
		description: '',
		...overrides,
	};
}

function makeSettings(overrides: Partial<PluginSettings> = {}): PluginSettings {
	return {
		checkboxes: [makeCheckbox()],
		enabled: true,
		iconSize: '90%',
		iconPosition: '50% 50%',
		iconStyle: 'stroke',
		...overrides,
	};
}

const EXPORTED_AT = new Date('2026-03-05T12:00:00.000Z');

describe('serializeConfig', () => {
	it('embeds the exact timestamp passed in, not the current time', () => {
		const json = serializeConfig(makeSettings(), EXPORTED_AT);
		const parsed = JSON.parse(json) as { timestamp: string };
		expect(parsed.timestamp).toBe('2026-03-05T12:00:00.000Z');
	});

	it('embeds the full settings object, not just checkboxes', () => {
		const settings = makeSettings({ iconSize: '75%', enabled: false });
		const json = serializeConfig(settings, EXPORTED_AT);
		const parsed = JSON.parse(json) as { settings: PluginSettings };
		expect(parsed.settings.iconSize).toBe('75%');
		expect(parsed.settings.enabled).toBe(false);
	});
});

describe('suggestFilename', () => {
	it('formats as checkbox-manager-YYYY-MM-DD.json', () => {
		expect(suggestFilename(EXPORTED_AT)).toBe('checkbox-manager-2026-03-05.json');
	});
});

describe('deserializeConfig', () => {
	it('round-trips: serialize then deserialize returns the same checkboxes', () => {
		const original = makeSettings({ checkboxes: [makeCheckbox({ symbol: '?', name: 'Question' })] });
		const json = serializeConfig(original, EXPORTED_AT);
		const result = deserializeConfig(json, makeSettings());
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.settings.checkboxes).toEqual(original.checkboxes);
			expect(result.checkboxCount).toBe(1);
			expect(result.timestamp).toBe('2026-03-05T12:00:00.000Z');
		}
	});

	it('merges over currentSettings, keeping fields absent from the backup', () => {
		const current = makeSettings({ iconSize: '110%', iconPosition: 'center' });
		const backup = JSON.stringify({ version: '2.0', plugin: 'x', timestamp: 't', settings: { checkboxes: [makeCheckbox()] } });
		const result = deserializeConfig(backup, current);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.settings.iconSize).toBe('110%');
			expect(result.settings.iconPosition).toBe('center');
		}
	});

	it('rejects malformed JSON', () => {
		const result = deserializeConfig('{not json', makeSettings());
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.reason).toContain('Error reading configuration file');
	});

	it('rejects a file with no checkboxes array', () => {
		const result = deserializeConfig(JSON.stringify({ settings: {} }), makeSettings());
		expect(result).toEqual({ ok: false, reason: 'Invalid configuration file format' });
	});

	it('rejects a checkbox missing a symbol, naming which one', () => {
		const backup = JSON.stringify({ settings: { checkboxes: [makeCheckbox(), { name: 'No symbol' }] } });
		const result = deserializeConfig(backup, makeSettings());
		expect(result).toEqual({ ok: false, reason: 'checkbox 2 is missing a symbol' });
	});

	it('rejects a checkbox missing a name, naming which one', () => {
		const backup = JSON.stringify({ settings: { checkboxes: [{ symbol: '!' }] } });
		const result = deserializeConfig(backup, makeSettings());
		expect(result).toEqual({ ok: false, reason: 'checkbox 1 is missing a name' });
	});
});
