import { describe, expect, it } from 'vitest';
import { generateCheckboxCSS } from './css-generator';
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
		checkboxes: [],
		enabled: true,
		iconSize: '90%',
		iconPosition: '50% 50%',
		iconStyle: 'filled',
		...overrides,
	};
}

describe('generateCheckboxCSS', () => {
	it('returns an empty string when custom checkboxes are disabled', () => {
		const css = generateCheckboxCSS(makeSettings({ enabled: false, checkboxes: [makeCheckbox()] }));
		expect(css).toBe('');
	});

	it('emits a mask-image CSS variable for a checkbox with icon data', () => {
		const css = generateCheckboxCSS(makeSettings({ checkboxes: [makeCheckbox({ symbol: '!' })] }));
		expect(css).toContain(`--cb-icon-${'!'.codePointAt(0)}:`);
		expect(css).toContain("input[data-task='!']");
	});

	it('skips the per-checkbox mask-image rule for a checkbox with no icon data', () => {
		// The symbol still appears once in the shared reset-properties selector block —
		// only the second pass, which pairs a symbol with a mask-image var, is skipped.
		const css = generateCheckboxCSS(
			makeSettings({ checkboxes: [makeCheckbox({ symbol: '?', icon: '', customIconData: undefined })] })
		);
		expect(css).not.toContain(`--cb-icon-${'?'.codePointAt(0)}`);
		expect(css).not.toMatch(/input\[data-task='\?'\][^\n]*mask-image/);
	});

	it('injects spinner keyframes only when a "/" checkbox is configured', () => {
		const withSpinner = generateCheckboxCSS(makeSettings({ checkboxes: [makeCheckbox({ symbol: '/' })] }));
		expect(withSpinner).toContain('@keyframes spin');

		const withoutSpinner = generateCheckboxCSS(makeSettings({ checkboxes: [makeCheckbox({ symbol: '!' })] }));
		expect(withoutSpinner).not.toContain('@keyframes spin');
	});

	it('reflects iconSize and iconPosition settings in the mask properties', () => {
		const css = generateCheckboxCSS(makeSettings({ iconSize: '75%', iconPosition: 'center', checkboxes: [] }));
		expect(css).toContain('-webkit-mask-size: 75%;');
		expect(css).toContain('-webkit-mask-position: center;');
	});

	// Regression guard: the mask-image data URI must declare xmlns on its root <svg> — without it,
	// Chromium can silently fail to decode the data:image/svg+xml resource, so -webkit-mask-image
	// resolves to "no mask" (a solid unmasked box) even though the CSS property text looks correct.
	it('declares the SVG namespace inside every mask-image data URI', () => {
		const css = generateCheckboxCSS(makeSettings({ checkboxes: [makeCheckbox({ symbol: '!' })] }));
		const varMatch = css.match(/--cb-icon-33: url\("([^"]+)"\)/);
		expect(varMatch).not.toBeNull();
		expect(decodeURIComponent(varMatch![1])).toContain('xmlns="http://www.w3.org/2000/svg"');
	});
});
