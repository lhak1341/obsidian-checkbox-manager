// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { iconDataFromElement, iconsFor, type IconSource } from './icon';

function parseSvgElement(markup: string): SVGSVGElement {
	const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
	return doc.querySelector('svg') as unknown as SVGSVGElement;
}

describe('parse', () => {
	it('extracts path data and viewBox from a valid filled (fontawesome) SVG', () => {
		const result = iconsFor('filled').parse('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M1 2 3 4"/></svg>');
		expect(result).toEqual({ ok: true, viewBox: '0 0 640 512', fields: { icon: 'M1 2 3 4', viewBox: '0 0 640 512' } });
	});

	it('joins multiple path elements with a space for filled SVGs', () => {
		const result = iconsFor('filled').parse('<svg viewBox="0 0 24 24"><path d="M1 1"/><path d="M2 2"/></svg>');
		expect(result).toEqual({ ok: true, viewBox: '0 0 24 24', fields: { icon: 'M1 1 M2 2', viewBox: '0 0 24 24' } });
	});

	it('defaults viewBox to 0 0 512 512 for filled SVGs missing a viewBox', () => {
		const result = iconsFor('filled').parse('<svg><path d="M1 1"/></svg>');
		expect(result).toEqual({ ok: true, viewBox: '0 0 512 512', fields: { icon: 'M1 1', viewBox: '0 0 512 512' } });
	});

	it('extracts mixed drawable elements and viewBox from a valid stroke (lucide) SVG', () => {
		const result = iconsFor('stroke').parse('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 1"/><circle cx="5" cy="5" r="2"/></svg>');
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.viewBox).toBe('0 0 24 24');
			expect(result.fields.customIconData?.elements).toHaveLength(2);
			expect(result.fields.customIconData?.elements[0]).toContain('<path');
			expect(result.fields.customIconData?.elements[1]).toContain('<circle');
		}
	});

	it('defaults viewBox to 0 0 24 24 for stroke SVGs missing a viewBox', () => {
		const result = iconsFor('stroke').parse('<svg><path d="M1 1"/></svg>');
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.viewBox).toBe('0 0 24 24');
	});

	it('rejects input that does not start with <svg', () => {
		const result = iconsFor('filled').parse('<div>not an svg</div>');
		expect(result).toEqual({ ok: false, reason: 'Not an SVG' });
	});

	it('rejects filled SVGs with no path elements', () => {
		const result = iconsFor('filled').parse('<svg viewBox="0 0 24 24"><circle cx="5" cy="5" r="2"/></svg>');
		expect(result).toEqual({ ok: false, reason: 'No path elements' });
	});

	it('rejects stroke SVGs with no drawable elements', () => {
		const result = iconsFor('stroke').parse('<svg viewBox="0 0 24 24"><title>empty</title></svg>');
		expect(result).toEqual({ ok: false, reason: 'No drawable elements' });
	});
});

describe('iconDataFromElement', () => {
	it('extracts drawable elements and viewBox from a registry SVGElement', () => {
		const svg = parseSvgElement('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 1"/><circle cx="5" cy="5" r="2"/></svg>');
		const result = iconDataFromElement(svg);
		expect(result.viewBox).toBe('0 0 24 24');
		expect(result.elements).toHaveLength(2);
		expect(result.elements[0]).toContain('<path');
		expect(result.elements[1]).toContain('<circle');
	});

	it('defaults viewBox to 0 0 24 24 when the element has none', () => {
		const svg = parseSvgElement('<svg xmlns="http://www.w3.org/2000/svg"><path d="M1 1"/></svg>');
		const result = iconDataFromElement(svg);
		expect(result.viewBox).toBe('0 0 24 24');
	});

	it('returns an empty elements array when there are no drawable children', () => {
		const svg = parseSvgElement('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>empty</title></svg>');
		const result = iconDataFromElement(svg);
		expect(result.elements).toHaveLength(0);
	});
});

describe('render', () => {
	const base: IconSource = { color: 'var(--color-orange)' };

	it('renders a filled icon as a fill-colored path, sized from its own viewBox', () => {
		const markup = iconsFor('filled').render({ ...base, icon: 'M1 1', viewBox: '0 0 512 512' });
		expect(markup).toBe(
			'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="var(--color-orange)"><path d="M1 1"/></svg>'
		);
	});

	it('renders a stroke icon from customIconData elements, sized from its own viewBox', () => {
		const markup = iconsFor('stroke').render({ ...base, customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M1 1"/>'] } });
		expect(markup).toBe(
			'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1"/></svg>'
		);
	});

	it('falls back to customIconData when style is filled but icon is missing', () => {
		const markup = iconsFor('filled').render({ ...base, customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M1 1"/>'] } });
		expect(markup).toContain('stroke="var(--color-orange)"');
	});

	it('falls back to icon when style is stroke but customIconData is missing', () => {
		const markup = iconsFor('stroke').render({ ...base, icon: 'M1 1', viewBox: '0 0 512 512' });
		expect(markup).toBe(
			'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="var(--color-orange)"><path d="M1 1"/></svg>'
		);
	});

	it('returns an empty string when neither representation is present', () => {
		expect(iconsFor('filled').render(base)).toBe('');
		expect(iconsFor('stroke').render(base)).toBe('');
	});

	// Regression guard: -webkit-mask-image renders at zero size in Chromium when the
	// referenced SVG has a viewBox but no explicit width/height — see dataUrl below.
	it('always includes explicit width/height so -webkit-mask-image sizes correctly', () => {
		const filled = iconsFor('filled').render({ ...base, icon: 'M1 1', viewBox: '0 0 512 512' });
		const stroke = iconsFor('stroke').render({ ...base, customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M1 1"/>'] } });
		expect(filled).toMatch(/^<svg xmlns="[^"]+" width="\d+" height="\d+"/);
		expect(stroke).toMatch(/^<svg xmlns="[^"]+" width="\d+" height="\d+"/);
	});

	// Regression guard: a data:image/svg+xml resource is parsed as a standalone document, not
	// inline HTML — without an explicit xmlns on the root <svg>, the browser can silently fail
	// to decode it as valid SVG, making -webkit-mask-image resolve to "no mask" (blank checkboxes)
	// even though getComputedStyle still reports the mask-image property's text value correctly.
	it('always declares the SVG namespace explicitly', () => {
		const filled = iconsFor('filled').render({ ...base, icon: 'M1 1', viewBox: '0 0 512 512' });
		const stroke = iconsFor('stroke').render({ ...base, customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M1 1"/>'] } });
		expect(filled).toContain('xmlns="http://www.w3.org/2000/svg"');
		expect(stroke).toContain('xmlns="http://www.w3.org/2000/svg"');
	});
});

describe('dataUrl', () => {
	const base: IconSource = { color: 'var(--color-orange)' };

	it('wraps rendered markup in a CSS url() data URI', () => {
		const url = iconsFor('filled').dataUrl({ ...base, icon: 'M1 1', viewBox: '0 0 512 512' });
		expect(url.startsWith('url("data:image/svg+xml,')).toBe(true);
		expect(url).toContain(encodeURIComponent('<path d="M1 1"/>'));
	});

	it('returns "none" when neither representation is present', () => {
		expect(iconsFor('filled').dataUrl(base)).toBe('none');
		expect(iconsFor('stroke').dataUrl(base)).toBe('none');
	});

	// Regression guard: a data:image/svg+xml resource used as -webkit-mask-image is parsed as an
	// isolated document — CSS custom properties like var(--color-orange) never resolve inside it,
	// so embedding one there silently produces a fully transparent mask (blank checkboxes).
	it('never embeds the literal color inside the mask SVG', () => {
		const filledUrl = iconsFor('filled').dataUrl({ ...base, icon: 'M1 1', viewBox: '0 0 512 512' });
		expect(decodeURIComponent(filledUrl)).not.toContain('var(--color-orange)');

		const strokeUrl = iconsFor('stroke').dataUrl({ ...base, customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M1 1"/>'] } });
		expect(decodeURIComponent(strokeUrl)).not.toContain('var(--color-orange)');
		expect(decodeURIComponent(strokeUrl)).toContain('stroke="currentColor"');
	});

	it('render (DOM use) still embeds the literal color, unlike dataUrl', () => {
		const markup = iconsFor('filled').render({ ...base, icon: 'M1 1', viewBox: '0 0 512 512' });
		expect(markup).toContain('fill="var(--color-orange)"');
	});
});

describe('hasIcon', () => {
	it('is true for a non-empty filled path and false for an empty one', () => {
		expect(iconsFor('filled').hasIcon({ icon: 'M1 1' })).toBe(true);
		expect(iconsFor('filled').hasIcon({ icon: '' })).toBe(false);
		expect(iconsFor('filled').hasIcon({})).toBe(false);
	});

	it('is true for stroke data with at least one element, false for an empty elements array', () => {
		expect(iconsFor('stroke').hasIcon({ customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M1 1"/>'] } })).toBe(true);
		expect(iconsFor('stroke').hasIcon({ customIconData: { viewBox: '0 0 24 24', elements: [] } })).toBe(false);
		expect(iconsFor('stroke').hasIcon({})).toBe(false);
	});

	it('only looks at its own style\'s representation, ignoring the other', () => {
		expect(iconsFor('stroke').hasIcon({ icon: 'M1 1' })).toBe(false);
		expect(iconsFor('filled').hasIcon({ customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M1 1"/>'] } })).toBe(false);
	});
});

describe('fieldsFrom', () => {
	it('keeps only the filled representation, defaulting a blank icon/viewBox', () => {
		expect(iconsFor('filled').fieldsFrom({})).toEqual({ icon: '', viewBox: '0 0 512 512' });
		expect(iconsFor('filled').fieldsFrom({ icon: 'M1 1', viewBox: '0 0 640 640', customIconData: { viewBox: '0 0 24 24', elements: ['x'] } })).toEqual({ icon: 'M1 1', viewBox: '0 0 640 640' });
	});

	it('keeps only the stroke representation', () => {
		const data = { viewBox: '0 0 24 24', elements: ['<path d="M1 1"/>'] };
		expect(iconsFor('stroke').fieldsFrom({ icon: 'M1 1', customIconData: data })).toEqual({ customIconData: data });
		expect(iconsFor('stroke').fieldsFrom({})).toEqual({ customIconData: undefined });
	});
});

describe('serialize', () => {
	it('returns null when there is nothing to show', () => {
		expect(iconsFor('filled').serialize({})).toBeNull();
		expect(iconsFor('stroke').serialize({ customIconData: { viewBox: '0 0 24 24', elements: [] } })).toBeNull();
	});

	it('pretty-prints the stroke style painted with currentColor', () => {
		const out = iconsFor('stroke').serialize({ customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M1 1"/>', '<path d="M2 2"/>'] } });
		expect(out).toContain('stroke="currentColor"');
		expect(out).toContain('\n  <path d="M1 1"/>\n  <path d="M2 2"/>\n</svg>');
	});
});
