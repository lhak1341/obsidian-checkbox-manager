import { App, getIcon } from 'obsidian';
import type { CustomIconData } from './types';
import { iconDataFromElement, parseIconMarkup, serializeIconSource, type IconStyle } from './icon';
import { IconSuggest } from './icon-suggest';
import { resolveLucideIconId } from './lucide-icons';

const FILLED_DEFAULT_VIEWBOX = '0 0 512 512';

export type IconInputValue = { icon: string; viewBox: string } | { customIconData: CustomIconData | null };

export interface IconInputOptions {
	app: App;
	style: IconStyle;
	initial: { icon?: string; viewBox?: string; customIconData?: CustomIconData | null };
	onChange: () => void;
}

export interface IconInputHandle {
	getValue(): IconInputValue;
}

/**
 * Textarea + validation + (stroke only) name-picker for the config modal's icon section. One
 * instance backs each of the "Icon (fontawesome/filled)" and "Icon (lucide/stroke)" sections —
 * paste and picker-select are two real sources (free text vs Obsidian's own trusted icon
 * registry), so they stay two entry points funnelling into one internal apply step.
 */
export function attachIconInput(container: HTMLElement, opts: IconInputOptions): IconInputHandle {
	const { app, style, initial, onChange } = opts;
	const isFilled = style === 'filled';

	let value: IconInputValue = isFilled
		? { icon: initial.icon || '', viewBox: initial.viewBox || FILLED_DEFAULT_VIEWBOX }
		: { customIconData: initial.customIconData ?? null };

	if (!isFilled) {
		const pickerInput = container.createEl('input', {
			cls: 'checkbox-config-icon-suggest-input',
			attr: { type: 'text', placeholder: 'Search icon by name…' },
		});
		new IconSuggest(app, pickerInput);
		pickerInput.addEventListener('input', () => {
			const iconId = pickerInput.value.trim();
			if (!iconId) return;
			const svgEl = getIcon(resolveLucideIconId(iconId));
			if (!svgEl) return;
			const customIconData = iconDataFromElement(svgEl);
			setValid({ customIconData }, customIconData.viewBox, true);
		});
	}

	const svgArea = container.createEl('textarea', { cls: 'checkbox-config-svg-input' });
	svgArea.placeholder = isFilled
		? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n  <path d="M256 32c14.2 0..."/>\n</svg>'
		: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ...>\n  <path d="..."/>\n</svg>';

	const extractedInfo = container.createDiv('checkbox-config-extracted-info');

	function syncTextarea() {
		const serialized = serializeIconSource(value, style);
		if (serialized !== null) svgArea.value = serialized;
	}
	syncTextarea();

	function setValid(next: IconInputValue, viewBox: string, syncText: boolean) {
		value = next;
		if (syncText) syncTextarea();
		extractedInfo.textContent = `viewBox: ${viewBox}`;
		svgArea.removeClass('is-invalid');
		svgArea.addClass('is-valid');
		onChange();
	}

	function setInvalid(reason: string) {
		value = isFilled ? { icon: '', viewBox: FILLED_DEFAULT_VIEWBOX } : { customIconData: null };
		extractedInfo.textContent = reason;
		svgArea.removeClass('is-valid');
		svgArea.addClass('is-invalid');
		onChange();
	}

	function setEmpty() {
		value = isFilled ? { icon: '', viewBox: FILLED_DEFAULT_VIEWBOX } : { customIconData: null };
		extractedInfo.textContent = '';
		svgArea.removeClass('is-valid', 'is-invalid');
		onChange();
	}

	svgArea.oninput = () => {
		const val = svgArea.value.trim();
		if (!val) {
			setEmpty();
			return;
		}
		const result = parseIconMarkup(val, style);
		if (!result.ok) {
			setInvalid(result.reason);
			return;
		}
		const next: IconInputValue = isFilled
			? { icon: result.icon ?? '', viewBox: result.viewBox }
			: { customIconData: result.customIconData ?? null };
		setValid(next, result.viewBox, false);
	};

	return { getValue: () => value };
}
