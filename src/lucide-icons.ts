import { addIcon, getIconIds } from 'obsidian';
import lucideIconSvgsJson from './lucide-icon-svgs.json';
import lucideIconTagsJson from './lucide-icon-tags.json';

// Full offline snapshot of Lucide's icon set (lucide-icons/lucide), refreshed
// via `bun run sync:lucide` — bundled at build time so every Lucide icon is
// available with zero network calls, regardless of which (older) subset the
// running Obsidian version bundles natively.
const LUCIDE_ICON_SVGS: Readonly<Record<string, string>> = lucideIconSvgsJson;

// Per-icon search synonyms lucide-static ships (e.g. "flask-conical" ->
// ["lab", "chemistry", "experiment", ...]) — same data lucide.dev's own icon
// search runs on. Applies uniformly regardless of native-vs-gap-filled
// source, since it's keyed by bare icon name either way.
const LUCIDE_ICON_TAGS: Readonly<Record<string, readonly string[]>> = lucideIconTagsJson;

// Obsidian's getIcon()/setIcon() special-case ids starting with "lucide-" to
// resolve only against its native, compiled-in Lucide set. addIcon()-registered
// entries under that prefix get enumerated by getIconIds() but silently fail
// to resolve at render time (confirmed in the sister obsidian-icon-shortcodes
// plugin). Gap-filler icons (real Lucide icons this Obsidian version doesn't
// bundle) are therefore registered under a separate namespace instead.
const GAP_ICON_PREFIX = 'checkbox-manager-lucide-';

// Obsidian wraps addIcon()-registered content in its own
// <svg viewBox="0 0 100 100"> template. Lucide's raw source is authored in a
// 24x24 viewBox, so passing it through unchanged renders icons tiny. A
// <g transform="scale(...)"> avoids nested-svg percentage-sizing quirks and
// uniformly scaling also scales stroke-width, preserving proportions.
function scaleToCustomIconViewport(svgText: string): string {
	const source = new DOMParser().parseFromString(svgText, 'image/svg+xml').documentElement;
	const [, , viewBoxWidth] = (source.getAttribute('viewBox') ?? '0 0 24 24').split(/\s+/).map(Number);
	const scale = 100 / (viewBoxWidth || 24);

	const group = createSvg('g');
	group.setAttribute('transform', `scale(${scale})`);
	for (const attr of ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']) {
		const value = source.getAttribute(attr);
		if (value) group.setAttribute(attr, value);
	}
	while (source.firstChild) group.appendChild(source.firstChild);

	return group.outerHTML;
}

let nativeNames = new Set<string>();
let gapNames = new Set<string>();

/** Registers every Lucide icon this Obsidian version doesn't already bundle under GAP_ICON_PREFIX. Call once from onload(). */
export function registerLucideIcons(): void {
	nativeNames = new Set(
		getIconIds()
			.filter((id) => id.startsWith('lucide-'))
			.map((id) => id.slice('lucide-'.length))
	);

	const gaps = new Set<string>();
	for (const [name, svg] of Object.entries(LUCIDE_ICON_SVGS)) {
		if (nativeNames.has(name)) continue;
		addIcon(GAP_ICON_PREFIX + name, scaleToCustomIconViewport(svg));
		gaps.add(name);
	}
	gapNames = gaps;
}

/** Union of natively-bundled and gap-filled Lucide icon names, bare (no prefix). */
export function allLucideIconNames(): string[] {
	return Array.from(new Set([...nativeNames, ...gapNames]));
}

/** Search synonyms for a bare icon name (e.g. "flask-conical" -> ["lab", "chemistry", ...]), or [] if untagged. */
export function getLucideIconTags(name: string): readonly string[] {
	return LUCIDE_ICON_TAGS[name] ?? [];
}

/** Resolves a bare icon name (e.g. "mosque") to whatever id getIcon()/setIcon() will actually resolve. */
export function resolveLucideIconId(bareName: string): string {
	if (nativeNames.has(bareName)) return 'lucide-' + bareName;
	if (gapNames.has(bareName)) return GAP_ICON_PREFIX + bareName;
	return bareName;
}
