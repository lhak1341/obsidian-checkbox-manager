import { sanitizeHTMLToDom } from 'obsidian';
import type { IconSource, Icons } from './icon';

/** Renders a checkbox's icon and appends it to `el`, if there's anything to render. Shared by every DOM insertion site (config-modal preview, settings-tab list items, insert-checkbox suggestions) instead of each repeating render()+sanitizeHTMLToDom(). */
export function renderIconInto(el: HTMLElement, icons: Icons, source: IconSource): void {
	const markup = icons.render(source);
	if (markup) el.appendChild(sanitizeHTMLToDom(markup));
}
