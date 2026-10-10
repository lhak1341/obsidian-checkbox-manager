// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getIconIds, addIcon, removeIcon, getIcon, setIcon } from 'obsidian';
import { registerLucideIcons, unregisterLucideIcons, allLucideIconNames, getLucideIconTags, getResolvedIcon, setResolvedIcon } from './lucide-icons';

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
		vi.mocked(getIcon).mockReset();
	});

	it('treats getIconIds()-reported lucide- ids as natively bundled', () => {
		vi.mocked(getIconIds).mockReturnValue(['lucide-accessibility', 'not-lucide-prefixed']);
		registerLucideIcons();

		getResolvedIcon('accessibility');
		expect(getIcon).toHaveBeenCalledWith('lucide-accessibility');
		expect(allLucideIconNames()).toContain('accessibility');
	});

	it('gap-fills a bundled Lucide icon Obsidian does not report as native, under the gap prefix', () => {
		vi.mocked(getIconIds).mockReturnValue([]);
		registerLucideIcons();

		getResolvedIcon('mosque');
		expect(getIcon).toHaveBeenCalledWith('checkbox-manager-lucide-mosque');
		expect(allLucideIconNames()).toContain('mosque');
		expect(addIcon).toHaveBeenCalledWith('checkbox-manager-lucide-mosque', expect.stringContaining('<g transform="scale('));
	});

	it('does not gap-fill an icon Obsidian already reports as native', () => {
		vi.mocked(getIconIds).mockReturnValue(['lucide-mosque']);
		registerLucideIcons();

		getResolvedIcon('mosque');
		expect(getIcon).toHaveBeenCalledWith('lucide-mosque');
		expect(addIcon).not.toHaveBeenCalledWith('checkbox-manager-lucide-mosque', expect.anything());
	});

	it('falls back to the bare name for an unknown icon', () => {
		vi.mocked(getIconIds).mockReturnValue([]);
		registerLucideIcons();

		getResolvedIcon('totally-not-a-real-icon');
		expect(getIcon).toHaveBeenCalledWith('totally-not-a-real-icon');
	});
});

describe('unregisterLucideIcons', () => {
	beforeEach(() => {
		vi.mocked(getIconIds).mockReset();
		vi.mocked(addIcon).mockReset();
		vi.mocked(removeIcon).mockReset();
	});

	it('removes exactly the gap-filled icons registerLucideIcons() added', () => {
		vi.mocked(getIconIds).mockReturnValue(['lucide-mosque']);
		registerLucideIcons();
		const added = vi.mocked(addIcon).mock.calls.map(([id]) => id).sort();

		unregisterLucideIcons();

		expect(added.length).toBeGreaterThan(0);
		expect(vi.mocked(removeIcon).mock.calls.map(([id]) => id).sort()).toEqual(added);
		expect(removeIcon).not.toHaveBeenCalledWith('lucide-mosque');
	});

	it('forgets the registered names', () => {
		vi.mocked(getIconIds).mockReturnValue(['lucide-mosque']);
		registerLucideIcons();
		expect(allLucideIconNames()).toContain('mosque');

		unregisterLucideIcons();

		expect(allLucideIconNames()).toEqual([]);
	});

	it('is a no-op when nothing was registered', () => {
		unregisterLucideIcons();
		unregisterLucideIcons();
		expect(removeIcon).not.toHaveBeenCalled();
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

describe('getResolvedIcon', () => {
	beforeEach(() => {
		vi.mocked(getIcon).mockReset();
		vi.mocked(getIconIds).mockReturnValue(['lucide-mosque']);
		registerLucideIcons();
	});

	it('calls getIcon() with the resolved id, not the bare name', () => {
		getResolvedIcon('mosque');
		expect(getIcon).toHaveBeenCalledWith('lucide-mosque');
	});

	it('returns whatever getIcon() returns', () => {
		const el = {} as SVGSVGElement;
		vi.mocked(getIcon).mockReturnValue(el);
		expect(getResolvedIcon('mosque')).toBe(el);
	});
});

describe('setResolvedIcon', () => {
	beforeEach(() => {
		vi.mocked(setIcon).mockReset();
		vi.mocked(getIconIds).mockReturnValue([]);
		registerLucideIcons();
	});

	it('calls setIcon() with the element and the resolved (gap-filled) id, not the bare name', () => {
		const el = document.createElement('span');
		setResolvedIcon(el, 'mosque');
		expect(setIcon).toHaveBeenCalledWith(el, 'checkbox-manager-lucide-mosque');
	});
});
