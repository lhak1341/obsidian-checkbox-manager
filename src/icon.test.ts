// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { iconDataUrl, parseIconMarkup, renderIcon, type IconSource } from './icon';

describe('parseIconMarkup', () => {
	it('extracts path data and viewBox from a valid filled (fontawesome) SVG', () => {
		const result = parseIconMarkup('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M1 2 3 4"/></svg>', 'filled');
		expect(result).toEqual({ ok: true, icon: 'M1 2 3 4', viewBox: '0 0 640 512' });
	});

	it('joins multiple path elements with a space for filled SVGs', () => {
		const result = parseIconMarkup('<svg viewBox="0 0 24 24"><path d="M1 1"/><path d="M2 2"/></svg>', 'filled');
		expect(result).toEqual({ ok: true, icon: 'M1 1 M2 2', viewBox: '0 0 24 24' });
	});

	it('defaults viewBox to 0 0 512 512 for filled SVGs missing a viewBox', () => {
		const result = parseIconMarkup('<svg><path d="M1 1"/></svg>', 'filled');
		expect(result).toEqual({ ok: true, icon: 'M1 1', viewBox: '0 0 512 512' });
	});

	it('extracts mixed drawable elements and viewBox from a valid stroke (lucide) SVG', () => {
		const result = parseIconMarkup(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 1"/><circle cx="5" cy="5" r="2"/></svg>',
			'stroke'
		);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.viewBox).toBe('0 0 24 24');
			expect(result.customIconData?.elements).toHaveLength(2);
			expect(result.customIconData?.elements?.[0]).toContain('<path');
			expect(result.customIconData?.elements?.[1]).toContain('<circle');
		}
	});

	it('defaults viewBox to 0 0 24 24 for stroke SVGs missing a viewBox', () => {
		const result = parseIconMarkup('<svg><path d="M1 1"/></svg>', 'stroke');
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.viewBox).toBe('0 0 24 24');
	});

	it('rejects input that does not start with <svg', () => {
		const result = parseIconMarkup('<div>not an svg</div>', 'filled');
		expect(result).toEqual({ ok: false, reason: 'Not an SVG' });
	});

	it('rejects filled SVGs with no path elements', () => {
		const result = parseIconMarkup('<svg viewBox="0 0 24 24"><circle cx="5" cy="5" r="2"/></svg>', 'filled');
		expect(result).toEqual({ ok: false, reason: 'No path elements' });
	});

	it('rejects stroke SVGs with no drawable elements', () => {
		const result = parseIconMarkup('<svg viewBox="0 0 24 24"><title>empty</title></svg>', 'stroke');
		expect(result).toEqual({ ok: false, reason: 'No drawable elements' });
	});
});

describe('renderIcon', () => {
	const base: IconSource = { color: 'var(--color-orange)' };

	it('renders a filled icon as a fill-colored path, sized from its own viewBox', () => {
		const markup = renderIcon({ ...base, icon: 'M1 1', viewBox: '0 0 512 512' }, 'filled');
		expect(markup).toBe(
			'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="var(--color-orange)"><path d="M1 1"/></svg>'
		);
	});

	it('renders a stroke icon from customIconData elements, sized from its own viewBox', () => {
		const markup = renderIcon(
			{ ...base, customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M1 1"/>'] } },
			'stroke'
		);
		expect(markup).toBe(
			'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1"/></svg>'
		);
	});

	it('renders a stroke icon from customIconData paths (legacy shape)', () => {
		const markup = renderIcon({ ...base, customIconData: { viewBox: '0 0 24 24', paths: ['M1 1'] } }, 'stroke');
		expect(markup).toContain('<path d="M1 1"/>');
	});

	it('falls back to customIconData when style is filled but icon is missing', () => {
		const markup = renderIcon(
			{ ...base, customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M1 1"/>'] } },
			'filled'
		);
		expect(markup).toContain('stroke="var(--color-orange)"');
	});

	it('falls back to icon when style is stroke but customIconData is missing', () => {
		const markup = renderIcon({ ...base, icon: 'M1 1', viewBox: '0 0 512 512' }, 'stroke');
		expect(markup).toBe(
			'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="var(--color-orange)"><path d="M1 1"/></svg>'
		);
	});

	it('returns an empty string when neither representation is present', () => {
		expect(renderIcon(base, 'filled')).toBe('');
		expect(renderIcon(base, 'stroke')).toBe('');
	});

	// Regression guard: -webkit-mask-image renders at zero size in Chromium when the
	// referenced SVG has a viewBox but no explicit width/height — see iconDataUrl below.
	it('always includes explicit width/height so -webkit-mask-image sizes correctly', () => {
		const filled = renderIcon({ ...base, icon: 'M1 1', viewBox: '0 0 512 512' }, 'filled');
		const stroke = renderIcon({ ...base, customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M1 1"/>'] } }, 'stroke');
		expect(filled).toMatch(/^<svg xmlns="[^"]+" width="\d+" height="\d+"/);
		expect(stroke).toMatch(/^<svg xmlns="[^"]+" width="\d+" height="\d+"/);
	});

	// Regression guard: a data:image/svg+xml resource is parsed as a standalone document, not
	// inline HTML — without an explicit xmlns on the root <svg>, the browser can silently fail
	// to decode it as valid SVG, making -webkit-mask-image resolve to "no mask" (blank checkboxes)
	// even though getComputedStyle still reports the mask-image property's text value correctly.
	it('always declares the SVG namespace explicitly', () => {
		const filled = renderIcon({ ...base, icon: 'M1 1', viewBox: '0 0 512 512' }, 'filled');
		const stroke = renderIcon({ ...base, customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M1 1"/>'] } }, 'stroke');
		expect(filled).toContain('xmlns="http://www.w3.org/2000/svg"');
		expect(stroke).toContain('xmlns="http://www.w3.org/2000/svg"');
	});
});

describe('iconDataUrl', () => {
	const base: IconSource = { color: 'var(--color-orange)' };

	it('wraps rendered markup in a CSS url() data URI', () => {
		const url = iconDataUrl({ ...base, icon: 'M1 1', viewBox: '0 0 512 512' }, 'filled');
		expect(url.startsWith('url("data:image/svg+xml,')).toBe(true);
		expect(url).toContain(encodeURIComponent('<path d="M1 1"/>'));
	});

	it('returns "none" when neither representation is present', () => {
		expect(iconDataUrl(base, 'filled')).toBe('none');
		expect(iconDataUrl(base, 'stroke')).toBe('none');
	});

	// Regression guard: a data:image/svg+xml resource used as -webkit-mask-image is parsed as an
	// isolated document — CSS custom properties like var(--color-orange) never resolve inside it,
	// so embedding one there silently produces a fully transparent mask (blank checkboxes).
	it('never embeds the literal color inside the mask SVG', () => {
		const filledUrl = iconDataUrl({ ...base, icon: 'M1 1', viewBox: '0 0 512 512' }, 'filled');
		expect(decodeURIComponent(filledUrl)).not.toContain('var(--color-orange)');

		const strokeUrl = iconDataUrl(
			{ ...base, customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M1 1"/>'] } },
			'stroke'
		);
		expect(decodeURIComponent(strokeUrl)).not.toContain('var(--color-orange)');
		expect(decodeURIComponent(strokeUrl)).toContain('stroke="currentColor"');
	});

	it('renderIcon (DOM use) still embeds the literal color, unlike iconDataUrl', () => {
		const markup = renderIcon({ ...base, icon: 'M1 1', viewBox: '0 0 512 512' }, 'filled');
		expect(markup).toContain('fill="var(--color-orange)"');
	});
});
