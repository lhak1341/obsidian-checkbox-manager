import { sanitizeHTMLToDom } from 'obsidian';
import { renderIcon, type IconSource, type IconStyle } from './icon';

/** Renders a checkbox's icon and appends it to `el`, if there's anything to render. Shared by every DOM insertion site (config-modal preview, settings-tab list items, insert-checkbox suggestions) instead of each repeating renderIcon()+sanitizeHTMLToDom(). */
export function renderIconInto(el: HTMLElement, source: IconSource, style: IconStyle): void {
	const markup = renderIcon(source, style);
	if (markup) el.appendChild(sanitizeHTMLToDom(markup));
}
