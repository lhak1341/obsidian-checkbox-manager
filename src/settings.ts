import type { CheckboxConfig, CustomIconData, PluginSettings } from './types';
import { FILLED_DEFAULT_VIEWBOX } from './icon';
import { DEFAULT_CHECKBOXES, DEFAULT_SETTINGS } from './defaults';

/** customIconData as older versions persisted it: `paths` (bare `d` strings) instead of `elements`. */
type StoredIconData = { viewBox: string; elements?: string[]; paths?: string[] };

function migrateIconData(data: StoredIconData): CustomIconData {
	const elements = data.elements ?? (data.paths ?? []).map((d) => `<path d="${d}"/>`);
	return { viewBox: data.viewBox, elements };
}

/**
 * Brings any settings object (from loadData(), an imported backup, or nothing at all) to the
 * current shape: missing top-level fields come from DEFAULT_SETTINGS, each checkbox gets a
 * viewBox, legacy `paths` become `elements`, and a checkbox lacking customIconData inherits the
 * default with the same symbol.
 * Never mutates its input.
 */
export function normalizeSettings(raw: Partial<PluginSettings> | null | undefined): PluginSettings {
	const merged = { ...DEFAULT_SETTINGS, ...raw };

	const checkboxes = merged.checkboxes.map((checkbox): CheckboxConfig => {
		const result = { ...checkbox };
		if (!result.viewBox) result.viewBox = FILLED_DEFAULT_VIEWBOX;
		if (result.customIconData) result.customIconData = migrateIconData(result.customIconData);
		if (!result.customIconData) {
			const def = DEFAULT_CHECKBOXES.find((d) => d.symbol === result.symbol);
			if (def?.customIconData) result.customIconData = structuredClone(def.customIconData);
		}
		return result;
	});

	return { ...merged, checkboxes, iconStyle: merged.iconStyle || 'stroke' };
}

/** Returns `settings` with its checkboxes replaced by deep copies of the defaults; every other setting is kept. */
export function resetCheckboxes(settings: PluginSettings): PluginSettings {
	return { ...settings, checkboxes: structuredClone(DEFAULT_CHECKBOXES) };
}
