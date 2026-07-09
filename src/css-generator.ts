import type { PluginSettings } from './types';
import { iconDataUrl } from './icon';

function isSel(symbol: string): string {
	return `:is(input[data-task='${symbol}'], [data-task='${symbol}'] > input, [data-task='${symbol}'] > p > input):checked`;
}

function varName(symbol: string): string {
	return `--cb-icon-${symbol.codePointAt(0)}`;
}

export function generateCheckboxCSS(settings: PluginSettings): string {
	if (!settings.enabled) return '';

	const spinner = settings.checkboxes.find((cb) => cb.symbol === '/');
	const regular = settings.checkboxes.filter((cb) => cb.symbol !== '/');

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

	const style = settings.iconStyle || 'stroke';
	const allCheckboxes = [...regular, ...(spinner ? [spinner] : [])];
	const iconVars = allCheckboxes
		.map((cb) => ({ cb, url: iconDataUrl(cb, style) }))
		.filter(({ url }) => url !== 'none')
		.map(({ cb, url }) => `  ${varName(cb.symbol)}: ${url};`);

	if (iconVars.length) {
		css += `\n:root {\n${iconVars.join('\n')}\n}\n`;
	}

	if (regular.length) {
		css += `
/* Shared checkbox properties */
${regular.map((cb) => isSel(cb.symbol)).join(',\n')} {
	--checkbox-marker-color: transparent;
	border: none;
	border-radius: 0;
	background-image: none;
	background-color: currentColor;
	pointer-events: none;
}
`;
	}

	for (const cb of regular) {
		if (iconDataUrl(cb, style) === 'none') continue;
		css += `
/* [${cb.symbol}] ${cb.name} */
${isSel(cb.symbol)} { color: ${cb.color}; -webkit-mask-image: var(${varName(cb.symbol)}); }
`;
	}

	if (spinner) {
		const spinUrl = iconDataUrl(spinner, style);
		const maskProp = spinUrl !== 'none' ? `-webkit-mask-image: var(${varName('/')});` : '';
		css += `
/* [/] ${spinner.name} - Spinning */
${isSel('/')} {
	--checkbox-marker-color: transparent;
	border: none;
	border-radius: 0;
	background-image: none;
	background-color: currentColor;
	color: ${spinner.color};
	${maskProp}
	pointer-events: none;
	animation: spin 2s linear infinite;
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
	}

	return css;
}
