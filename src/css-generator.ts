import type { PluginSettings } from './types';
import { iconsFor } from './icon';

function isSel(symbol: string): string {
	return `:is(input[data-task='${symbol}'], [data-task='${symbol}'] > input, [data-task='${symbol}'] > p > input):checked`;
}

/** The checkbox with this symbol also rotates continuously (see CONTEXT.md's Spinner). */
export const SPINNER_SYMBOL = '/';

function varName(symbol: string): string {
	return `--cb-icon-${symbol.codePointAt(0)}`;
}

export function generateCheckboxCSS(settings: PluginSettings): string {
	if (!settings.enabled) return '';

	let css = `
/* Checkbox Manager Plugin Styles */
.markdown-preview-view .task-list-item-checkbox {
	position: relative;
	top: var(--checkbox-top);
	left: var(--checkbox-left);
}
.markdown-preview-view ul > li.task-list-item { text-indent: 0; }
input {
	-webkit-mask-size: ${settings.iconSize};
	-webkit-mask-repeat: no-repeat;
	-webkit-mask-position: ${settings.iconPosition};
}
`;

	const icons = iconsFor(settings.iconStyle);
	const urlBySymbol = new Map(settings.checkboxes.map((cb) => [cb.symbol, icons.dataUrl(cb)]));
	// A checkbox with nothing drawable emits no rule, so it keeps Obsidian's own look.
	const drawable = settings.checkboxes.filter((cb) => urlBySymbol.get(cb.symbol) !== 'none');
	if (!drawable.length) return css;

	css += `\n:root {\n${drawable.map((cb) => `  ${varName(cb.symbol)}: ${urlBySymbol.get(cb.symbol)};`).join('\n')}\n}\n`;

	css += `
/* Shared checkbox properties */
${drawable.map((cb) => isSel(cb.symbol)).join(',\n')} {
	--checkbox-marker-color: transparent;
	border: none;
	border-radius: 0;
	background-image: none;
	background-color: currentColor;
	pointer-events: none;
}
`;

	for (const cb of drawable) {
		const animation = cb.symbol === SPINNER_SYMBOL ? ' animation: spin 2s linear infinite;' : '';
		css += `
/* [${cb.symbol}] ${cb.name} */
${isSel(cb.symbol)} { color: ${cb.color}; -webkit-mask-image: var(${varName(cb.symbol)});${animation} }
`;
	}

	if (drawable.some((cb) => cb.symbol === SPINNER_SYMBOL)) {
		css += '\n@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\n';
	}

	return css;
}
