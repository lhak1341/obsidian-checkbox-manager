import { App } from 'obsidian';
import { iconDataFromElement, type IconFields, type Icons } from './icon';
import { IconSuggest } from './icon-suggest';
import { getResolvedIcon } from './lucide-icons';

export interface IconInputOptions {
	app: App;
	icons: Icons;
	initial: IconFields;
	onChange: () => void;
}

export interface IconInputHandle {
	getValue(): IconFields;
	hasValue(): boolean;
}

/**
 * Textarea + validation + (when the style supports it) name-picker for the config modal's icon
 * section. Paste and picker-select are two real sources (free text vs Obsidian's own trusted icon
 * registry), so they stay two entry points funnelling into one internal apply step.
 */
export function attachIconInput(container: HTMLElement, opts: IconInputOptions): IconInputHandle {
	const { app, icons, initial, onChange } = opts;

	let value = icons.fieldsFrom(initial);

	if (icons.supportsPicker) {
		const pickerInput = container.createEl('input', {
			cls: 'checkbox-config-icon-suggest-input',
			attr: { type: 'text', placeholder: 'Search icon by name…' },
		});
		new IconSuggest(app, pickerInput);
		pickerInput.addEventListener('input', () => {
			const iconId = pickerInput.value.trim();
			if (!iconId) return;
			const svgEl = getResolvedIcon(iconId);
			if (!svgEl) return;
			const customIconData = iconDataFromElement(svgEl);
			setValid({ customIconData }, customIconData.viewBox, true);
		});
	}

	const svgArea = container.createEl('textarea', { cls: 'checkbox-config-svg-input' });
	svgArea.placeholder = icons.placeholder;

	const extractedInfo = container.createDiv('checkbox-config-extracted-info');

	function syncTextarea() {
		const serialized = icons.serialize(value);
		if (serialized !== null) svgArea.value = serialized;
	}
	syncTextarea();

	function setValid(next: IconFields, viewBox: string, syncText: boolean) {
		value = next;
		if (syncText) syncTextarea();
		extractedInfo.textContent = `viewBox: ${viewBox}`;
		svgArea.removeClass('is-invalid');
		svgArea.addClass('is-valid');
		onChange();
	}

	function setInvalid(reason: string) {
		value = icons.fieldsFrom({});
		extractedInfo.textContent = reason;
		svgArea.removeClass('is-valid');
		svgArea.addClass('is-invalid');
		onChange();
	}

	function setEmpty() {
		value = icons.fieldsFrom({});
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
		const result = icons.parse(val);
		if (!result.ok) {
			setInvalid(result.reason);
			return;
		}
		setValid(result.fields, result.viewBox, false);
	};

	return { getValue: () => value, hasValue: () => icons.hasIcon(value) };
}
