import type { CheckboxConfig } from './types';
import { FILLED_DEFAULT_VIEWBOX, type IconFields, type Icons } from './icon';
import { findSymbolClash, symbolClashMessage } from './checkbox-list';

/** The config modal's colour dropdown; the first entry is the default for a new checkbox. */
export const COLOR_OPTIONS: readonly { value: string; label: string }[] = [
	{ value: 'var(--color-orange)', label: 'Orange' },
	{ value: 'var(--color-red)', label: 'Red' },
	{ value: 'var(--color-green)', label: 'Green' },
	{ value: 'var(--color-blue)', label: 'Blue' },
	{ value: 'var(--color-purple)', label: 'Purple' },
	{ value: 'var(--color-yellow)', label: 'Yellow' },
	{ value: 'var(--color-pink)', label: 'Pink' },
	{ value: 'var(--color-cyan)', label: 'Cyan' },
	{ value: 'var(--color-base-60)', label: 'Gray' },
	{ value: 'var(--background-modifier-accent)', label: 'Accent' },
	{ value: 'var(--color-base-100)', label: 'Default' },
];

export type FormResult = { ok: true; config: CheckboxConfig } | { ok: false; message: string };

export interface FormInput {
	/** The checkbox being edited, or null when adding. */
	existing: CheckboxConfig | null;
	form: { symbol: string; name: string; color: string };
	/** Only the representation being edited; the other one is carried over from `existing` — see CONTEXT.md's Icon entry. */
	iconFields: IconFields;
	icons: Icons;
	/** The current checkbox list, for the symbol-collision check. */
	checkboxes: CheckboxConfig[];
}

/**
 * Judges the config modal's form on its trimmed values and, when it is saveable, assembles the
 * CheckboxConfig that Save would submit — so the preview and the saved result are the same object.
 * `message` is what the modal shows while Save stays disabled: the missing fields, or a symbol
 * another checkbox already uses.
 */
export function evaluateForm({ existing, form, iconFields, icons, checkboxes }: FormInput): FormResult {
	const symbol = form.symbol.trim();
	const name = form.name.trim();

	const missing: string[] = [];
	if (!symbol) missing.push('symbol');
	if (!name) missing.push('name');
	if (!icons.hasIcon(iconFields)) missing.push('icon');
	if (missing.length) return { ok: false, message: `Missing: ${missing.join(', ')}` };

	const clash = findSymbolClash(checkboxes, symbol, existing?.symbol);
	if (clash) return { ok: false, message: symbolClashMessage(symbol, clash) };

	const icon = { icon: existing?.icon || '', viewBox: existing?.viewBox || FILLED_DEFAULT_VIEWBOX, customIconData: existing?.customIconData, ...iconFields };
	return {
		ok: true,
		config: {
			symbol,
			name,
			color: form.color.trim(),
			description: existing?.description || '',
			icon: icon.icon.trim(),
			viewBox: icon.viewBox.trim() || FILLED_DEFAULT_VIEWBOX,
			customIconData: icon.customIconData,
		},
	};
}
