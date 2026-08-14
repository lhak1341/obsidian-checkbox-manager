// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sanitizeHTMLToDom } from 'obsidian';
import { renderIconInto } from './icon-render';
import { renderIcon, type IconSource } from './icon';

// Wiring-level only: verifies renderIconInto threads the right markup to the right place, and
// no-ops on empty markup. It cannot catch the real Obsidian sanitizeHTMLToDom/renderer class of
// bug (missing xmlns, var() leaking into a mask — see CLAUDE.md) since that's outside jsdom;
// that class needs live testing via obsidian-cli, not a unit test.

const FILLED_SOURCE: IconSource = { icon: 'M1 1', viewBox: '0 0 512 512', color: 'red' };
const STROKE_SOURCE: IconSource = {
	customIconData: { viewBox: '0 0 24 24', elements: ['<path d="M2 2"/>'] },
	color: 'blue',
};

describe('renderIconInto', () => {
	it('does nothing when there is no icon to render', () => {
		const el = document.createElement('div');
		renderIconInto(el, { color: 'red' }, 'filled');

		expect(el.childNodes).toHaveLength(0);
	});

	it('threads the exact markup renderIcon() produces into sanitizeHTMLToDom, for filled', () => {
		const el = document.createElement('div');
		renderIconInto(el, FILLED_SOURCE, 'filled');

		expect(el.childNodes).toHaveLength(1);
		expect(sanitizeHTMLToDom).toHaveBeenCalledWith(renderIcon(FILLED_SOURCE, 'filled'));
	});

	it('threads the exact markup renderIcon() produces into sanitizeHTMLToDom, for stroke', () => {
		const el = document.createElement('div');
		renderIconInto(el, STROKE_SOURCE, 'stroke');

		expect(el.childNodes).toHaveLength(1);
		expect(sanitizeHTMLToDom).toHaveBeenCalledWith(renderIcon(STROKE_SOURCE, 'stroke'));
	});

	it('leaves existing children in place and appends after them', () => {
		const el = document.createElement('div');
		const marker = document.createElement('span');
		marker.textContent = 'Existing';
		el.appendChild(marker);

		renderIconInto(el, FILLED_SOURCE, 'filled');

		expect(el.childNodes).toHaveLength(2);
		expect(el.firstChild).toBe(marker);
	});
});
