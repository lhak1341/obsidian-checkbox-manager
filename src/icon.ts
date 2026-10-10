import type { CustomIconData, IconStyle } from './types';

export const FILLED_DEFAULT_VIEWBOX = '0 0 512 512';
const STROKE_DEFAULT_VIEWBOX = '0 0 24 24';
const STROKE_ELEMENT_SELECTOR = 'path, circle, rect, line, polyline, polygon, ellipse';
const SVG_XMLNS = 'http://www.w3.org/2000/svg';
const STROKE_PRESENTATION_ATTRS = 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/** The CheckboxConfig fields that carry an Icon (see CONTEXT.md) — lets callers work from in-progress form state, not just a saved CheckboxConfig. */
export interface IconFields {
	icon?: string;
	viewBox?: string;
	customIconData?: CustomIconData;
}

export interface IconSource extends IconFields {
	color: string;
}

export type ParseIconResult =
	| { ok: true; viewBox: string; fields: IconFields }
	| { ok: false; reason: string };

/**
 * Everything callers need to know about one icon style. Obtain via iconsFor(); callers hold the
 * result and never branch on filled vs stroke themselves. `render`/`dataUrl` fall back to the
 * other representation when the one matching the style is missing, so the settings preview never
 * shows an icon the actual checkbox CSS would fail to render. The editing methods (`parse`,
 * `serialize`, `hasIcon`, `fieldsFrom`) deal with this style's representation only.
 */
export interface Icons {
	readonly style: IconStyle;
	/** Section heading for the config modal's icon input. */
	readonly heading: string;
	/** Helper sentence (HTML) telling the user where to get this style's SVG. */
	readonly helperHtml: string;
	/** Textarea placeholder showing the expected SVG shape. */
	readonly placeholder: string;
	/** Whether this style's input offers the name picker (backed by Obsidian's Lucide registry). */
	readonly supportsPicker: boolean;
	/** Parses pasted SVG markup into this style's CheckboxConfig fields. */
	parse(svgString: string): ParseIconResult;
	/** Narrows saved/in-progress fields down to this style's representation, defaulting what's missing. */
	fieldsFrom(initial: IconFields): IconFields;
	/** Whether this style's own representation has anything drawable. */
	hasIcon(fields: IconFields): boolean;
	/** Editable, pretty-printed SVG source for the icon-input textarea, or null when there's nothing to show yet. */
	serialize(fields: IconFields): string | null;
	/** SVG markup for insertion into the DOM, in the source's actual color. */
	render(source: IconSource): string;
	/** Same fallback rule as render(), encoded as a CSS `url("data:image/svg+xml,...")` for use as a mask-image. */
	dataUrl(source: IconSource): string;
}

/** Bridges an SVGElement from Obsidian's icon registry (getIcon()) into the same CustomIconData shape the stroke style's parse() produces from a pasted lucide.dev SVG. */
export function iconDataFromElement(svg: SVGSVGElement): CustomIconData {
	const elements = Array.from(svg.querySelectorAll(STROKE_ELEMENT_SELECTOR));
	const viewBox = svg.getAttribute('viewBox') || STROKE_DEFAULT_VIEWBOX;
	return { viewBox, elements: elements.map((el) => el.outerHTML) };
}

/**
 * width/height, derived from the viewBox itself so aspect ratio is always exact.
 * -webkit-mask-image needs the SVG to declare an intrinsic size or Chromium renders it
 * at zero size, even with mask-size set — a viewBox alone isn't enough. DOM preview
 * contexts override this via CSS width/height, so it's safe to set here unconditionally.
 */
function viewBoxDimensions(viewBox: string): { width: string; height: string } {
	const parts = viewBox.trim().split(/\s+/);
	return { width: parts[2] || '24', height: parts[3] || '24' };
}

/**
 * `color` is `null` when building for a mask-image data URI: that SVG is parsed as an isolated
 * resource, so a CSS custom property like `var(--color-orange)` never resolves there — the
 * shape just needs to be opaque (SVG's default fill is black; `currentColor` resolves to black
 * with nothing else set). The real color is painted separately via `background-color: currentColor`
 * on the masked element, in css-generator.ts. DOM-inserted previews pass the literal color instead,
 * since an inline <svg> in the document *can* resolve custom properties from :root.
 */
function filledSvg(source: IconFields, color: string | null): string {
	if (!source.icon) return '';
	const viewBox = source.viewBox || FILLED_DEFAULT_VIEWBOX;
	const { width, height } = viewBoxDimensions(viewBox);
	const fillAttr = color ? ` fill="${color}"` : '';
	return `<svg xmlns="${SVG_XMLNS}" width="${width}" height="${height}" viewBox="${viewBox}"${fillAttr}><path d="${source.icon}"/></svg>`;
}

function strokeSvg(source: IconFields, color: string | null): string {
	const data = source.customIconData;
	if (!data?.elements.length) return '';
	const { width, height } = viewBoxDimensions(data.viewBox);
	return `<svg xmlns="${SVG_XMLNS}" width="${width}" height="${height}" viewBox="${data.viewBox}" fill="none" stroke="${color ?? 'currentColor'}" ${STROKE_PRESENTATION_ATTRS}>${data.elements.join('')}</svg>`;
}

function toDataUrl(markup: string): string {
	return markup ? `url("data:image/svg+xml,${encodeURIComponent(markup)}")` : 'none';
}

function parseSvgRoot(svgString: string): { svg: SVGSVGElement } | { reason: string } {
	const val = svgString.trim();
	if (!val.startsWith('<svg')) return { reason: 'Not an SVG' };
	const svg = new DOMParser().parseFromString(val, 'image/svg+xml').querySelector('svg');
	return svg ? { svg } : { reason: 'No SVG element' };
}

const FILLED_ICONS: Icons = {
	style: 'filled',
	heading: 'Icon (fontawesome/filled)',
	helperHtml: 'Go to <a href="https://fontawesome.com/icons" target="_blank">fontawesome.com</a>, find an icon, click <strong>SVG</strong> → copy and paste the full SVG below',
	placeholder: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n  <path d="M256 32c14.2 0..."/>\n</svg>',
	supportsPicker: false,

	parse(svgString) {
		const root = parseSvgRoot(svgString);
		if ('reason' in root) return { ok: false, reason: root.reason };
		const paths = Array.from(root.svg.querySelectorAll('path'));
		if (!paths.length) return { ok: false, reason: 'No path elements' };
		const icon = paths.map((p) => p.getAttribute('d')).filter(Boolean).join(' ');
		const viewBox = root.svg.getAttribute('viewBox') || FILLED_DEFAULT_VIEWBOX;
		return { ok: true, viewBox, fields: { icon, viewBox } };
	},

	fieldsFrom: (initial) => ({ icon: initial.icon || '', viewBox: initial.viewBox || FILLED_DEFAULT_VIEWBOX }),

	hasIcon: (fields) => !!fields.icon,

	serialize(fields) {
		if (!fields.icon) return null;
		const viewBox = fields.viewBox || FILLED_DEFAULT_VIEWBOX;
		return `<svg xmlns="${SVG_XMLNS}" viewBox="${viewBox}">\n  <path d="${fields.icon}"/>\n</svg>`;
	},

	render: (source) => filledSvg(source, source.color) || strokeSvg(source, source.color),
	dataUrl: (source) => toDataUrl(filledSvg(source, null) || strokeSvg(source, null)),
};

const STROKE_ICONS: Icons = {
	style: 'stroke',
	heading: 'Icon (lucide/stroke)',
	helperHtml: 'Go to <a href="https://lucide.dev/icons" target="_blank">lucide.dev</a>, search for an icon, copy the SVG, and paste it below — or pick one by name:',
	placeholder: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ...>\n  <path d="..."/>\n</svg>',
	supportsPicker: true,

	parse(svgString) {
		const root = parseSvgRoot(svgString);
		if ('reason' in root) return { ok: false, reason: root.reason };
		const elements = Array.from(root.svg.querySelectorAll(STROKE_ELEMENT_SELECTOR));
		if (!elements.length) return { ok: false, reason: 'No drawable elements' };
		const viewBox = root.svg.getAttribute('viewBox') || STROKE_DEFAULT_VIEWBOX;
		return { ok: true, viewBox, fields: { customIconData: { viewBox, elements: elements.map((el) => el.outerHTML) } } };
	},

	fieldsFrom: (initial) => ({ customIconData: initial.customIconData }),

	hasIcon: (fields) => !!fields.customIconData?.elements.length,

	// Always painted with stroke="currentColor": this is what the user edits, not what gets inserted into the DOM.
	serialize(fields) {
		const data = fields.customIconData;
		if (!data?.elements.length) return null;
		return `<svg xmlns="${SVG_XMLNS}" viewBox="${data.viewBox}" fill="none" stroke="currentColor" ${STROKE_PRESENTATION_ATTRS}>\n  ${data.elements.join('\n  ')}\n</svg>`;
	},

	render: (source) => strokeSvg(source, source.color) || filledSvg(source, source.color),
	dataUrl: (source) => toDataUrl(strokeSvg(source, null) || filledSvg(source, null)),
};

/** The one entry point to everything style-specific about an Icon: filled (fontawesome) or stroke (lucide). */
export function iconsFor(style: IconStyle): Icons {
	return style === 'filled' ? FILLED_ICONS : STROKE_ICONS;
}
