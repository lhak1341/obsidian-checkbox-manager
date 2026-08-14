// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getIconIds, addIcon } from 'obsidian';
import { registerLucideIcons, allLucideIconNames, getLucideIconTags, resolveLucideIconId } from './lucide-icons';

// Obsidian's createSvg() is a global helper (declared ambient in obsidian.d.ts), not a package
// export — jsdom doesn't have it, and scaleToCustomIconViewport() needs it to build the gap-icon's
// scaled <g> wrapper.
type CreateSvgFn = (tag: string) => SVGElement;
(globalThis as unknown as { createSvg: CreateSvgFn }).createSvg = (tag) =>
	document.createElementNS('http://www.w3.org/2000/svg', tag);

describe('registerLucideIcons', () => {
	beforeEach(() => {
		vi.mocked(getIconIds).mockReset();
		vi.mocked(addIcon).mockReset();
	});

	it('treats getIconIds()-reported lucide- ids as natively bundled', () => {
		vi.mocked(getIconIds).mockReturnValue(['lucide-accessibility', 'not-lucide-prefixed']);
		registerLucideIcons();

		expect(resolveLucideIconId('accessibility')).toBe('lucide-accessibility');
		expect(allLucideIconNames()).toContain('accessibility');
	});

	it('gap-fills a bundled Lucide icon Obsidian does not report as native, under the gap prefix', () => {
		vi.mocked(getIconIds).mockReturnValue([]);
		registerLucideIcons();

		expect(resolveLucideIconId('mosque')).toBe('checkbox-manager-lucide-mosque');
		expect(allLucideIconNames()).toContain('mosque');
		expect(addIcon).toHaveBeenCalledWith('checkbox-manager-lucide-mosque', expect.stringContaining('<g transform="scale('));
	});

	it('does not gap-fill an icon Obsidian already reports as native', () => {
		vi.mocked(getIconIds).mockReturnValue(['lucide-mosque']);
		registerLucideIcons();

		expect(resolveLucideIconId('mosque')).toBe('lucide-mosque');
		expect(addIcon).not.toHaveBeenCalledWith('checkbox-manager-lucide-mosque', expect.anything());
	});

	it('falls back to the bare name for an unknown icon', () => {
		vi.mocked(getIconIds).mockReturnValue([]);
		registerLucideIcons();

		expect(resolveLucideIconId('totally-not-a-real-icon')).toBe('totally-not-a-real-icon');
	});
});

describe('getLucideIconTags', () => {
	it('returns search synonyms for a known icon', () => {
		expect(getLucideIconTags('mosque')).toContain('minaret');
	});

	it('returns an empty array for an unknown icon', () => {
		expect(getLucideIconTags('totally-not-a-real-icon')).toEqual([]);
	});
});
