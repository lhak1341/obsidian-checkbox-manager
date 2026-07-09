import type { CustomIconData } from './types';

export type IconStyle = 'stroke' | 'filled';

export type ParseIconResult =
	| { ok: true; icon?: string; viewBox: string; customIconData?: CustomIconData }
	| { ok: false; reason: string };

/** The subset of CheckboxConfig that renderIcon()/iconDataUrl() need — lets callers render from in-progress form state, not just a saved CheckboxConfig. */
export interface IconSource {
	icon?: string;
	viewBox?: string;
	customIconData?: CustomIconData | null;
	color: string;
}

const FILLED_DEFAULT_VIEWBOX = '0 0 512 512';
const STROKE_DEFAULT_VIEWBOX = '0 0 24 24';
const STROKE_ELEMENT_SELECTOR = 'path, circle, rect, line, polyline, polygon, ellipse';

/** Parses SVG markup pasted from fontawesome.com ('filled') or lucide.dev ('stroke') into CheckboxConfig icon fields. */
export function parseIconMarkup(svgString: string, style: IconStyle): ParseIconResult {
	const val = svgString.trim();
	if (!val.startsWith('<svg')) return { ok: false, reason: 'Not an SVG' };

	const doc = new DOMParser().parseFromString(val, 'image/svg+xml');
	const svg = doc.querySelector('svg');
	if (!svg) return { ok: false, reason: 'No SVG element' };

	if (style === 'filled') {
		const paths = Array.from(svg.querySelectorAll('path'));
		if (!paths.length) return { ok: false, reason: 'No path elements' };
		const icon = paths.map((p) => p.getAttribute('d')).filter(Boolean).join(' ');
		const viewBox = svg.getAttribute('viewBox') || FILLED_DEFAULT_VIEWBOX;
		return { ok: true, icon, viewBox };
	}

	const elements = Array.from(svg.querySelectorAll(STROKE_ELEMENT_SELECTOR));
	if (!elements.length) return { ok: false, reason: 'No drawable elements' };
	const viewBox = svg.getAttribute('viewBox') || STROKE_DEFAULT_VIEWBOX;
	return { ok: true, viewBox, customIconData: { viewBox, elements: elements.map((el) => el.outerHTML) } };
}

function strokeElementsMarkup(customIconData: CustomIconData): string {
	if (customIconData.elements) return customIconData.elements.join('');
	return (customIconData.paths || []).map((d) => `<path d="${d}"/>`).join('');
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
 * Builds the SVG markup shared by renderIcon() and iconDataUrl(), sized from its own viewBox.
 * Falls back to the other representation when the one matching `style` is missing, so the
 * settings preview never shows an icon the actual checkbox CSS would fail to render.
 *
 * `color` is `null` when building for a mask-image data URI: that SVG is parsed as an isolated
 * resource, so a CSS custom property like `var(--color-orange)` never resolves there — the
 * shape just needs to be opaque (SVG's default fill is black; `currentColor` resolves to black
 * with nothing else set). The real color is painted separately via `background-color: currentColor`
 * on the masked element, in css-generator.ts. DOM-inserted previews pass the literal color instead,
 * since an inline <svg> in the document *can* resolve custom properties from :root.
 */
const SVG_XMLNS = 'http://www.w3.org/2000/svg';

function buildSvgMarkup(checkbox: IconSource, style: IconStyle, color: string | null): string {
	if (style === 'filled' && checkbox.icon) {
		const viewBox = checkbox.viewBox || FILLED_DEFAULT_VIEWBOX;
		const { width, height } = viewBoxDimensions(viewBox);
		const fillAttr = color ? ` fill="${color}"` : '';
		return `<svg xmlns="${SVG_XMLNS}" width="${width}" height="${height}" viewBox="${viewBox}"${fillAttr}><path d="${checkbox.icon}"/></svg>`;
	}

	if (checkbox.customIconData) {
		const elements = strokeElementsMarkup(checkbox.customIconData);
		if (elements) {
			const { width, height } = viewBoxDimensions(checkbox.customIconData.viewBox);
			return `<svg xmlns="${SVG_XMLNS}" width="${width}" height="${height}" viewBox="${checkbox.customIconData.viewBox}" fill="none" stroke="${color ?? 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${elements}</svg>`;
		}
	}

	if (checkbox.icon) {
		const viewBox = checkbox.viewBox || FILLED_DEFAULT_VIEWBOX;
		const { width, height } = viewBoxDimensions(viewBox);
		const fillAttr = color ? ` fill="${color}"` : '';
		return `<svg xmlns="${SVG_XMLNS}" width="${width}" height="${height}" viewBox="${viewBox}"${fillAttr}><path d="${checkbox.icon}"/></svg>`;
	}

	return '';
}

/** Renders a checkbox's icon as SVG markup for insertion into the DOM, in its actual configured color. */
export function renderIcon(checkbox: IconSource, style: IconStyle): string {
	return buildSvgMarkup(checkbox, style, checkbox.color);
}

/** Same fallback rule as renderIcon(), encoded as a CSS `url("data:image/svg+xml,...")` for use as a mask-image. */
export function iconDataUrl(checkbox: IconSource, style: IconStyle): string {
	const markup = buildSvgMarkup(checkbox, style, null);
	if (!markup) return 'none';
	return `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;
}
