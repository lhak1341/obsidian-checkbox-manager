import type { CheckboxConfig } from './types';
import type { IconInputValue } from './icon-input';

export type ValidityResult = { ok: true } | { ok: false; missing: string[] };

/** Which required fields (symbol, name, icon) the config modal's form is still missing. */
export function describeValidity(symbol: string, name: string, hasIcon: boolean): ValidityResult {
	const missing: string[] = [];
	if (!symbol) missing.push('symbol');
	if (!name) missing.push('name');
	if (!hasIcon) missing.push('icon');
	return missing.length ? { ok: false, missing } : { ok: true };
}

/**
 * Assembles a CheckboxConfig from the modal's form state. Assumes symbol/name are already
 * non-empty (the save button is disabled otherwise). Preserves the representation not being
 * edited — see CONTEXT.md's Icon entry: a checkbox can carry both, one, or (transiently) neither.
 */
export function buildCheckboxConfig(existing: CheckboxConfig | null, form: { symbol: string; name: string; color: string }, iconValue: IconInputValue): CheckboxConfig {
	const result: CheckboxConfig = {
		symbol: form.symbol.trim(),
		name: form.name.trim(),
		color: form.color.trim(),
		description: existing?.description || '',
		icon: existing?.icon || '',
		viewBox: existing?.viewBox || '0 0 512 512',
		customIconData: existing?.customIconData,
	};

	if ('icon' in iconValue) {
		result.icon = iconValue.icon.trim();
		result.viewBox = iconValue.viewBox.trim() || '0 0 512 512';
	} else {
		result.customIconData = iconValue.customIconData ?? undefined;
	}

	return result;
}
