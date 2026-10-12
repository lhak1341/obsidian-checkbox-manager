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

/** Outcome of a whole-settings change: the new settings plus an optional Notice text (absent means show nothing), or why it was refused. Operations never mutate their input. */
export type SettingsResult =
	| { ok: true; settings: PluginSettings; message?: string }
	| { ok: false; reason: string };

/** Replaces the checkboxes with deep copies of the defaults; every other setting is kept. */
export function resetCheckboxes(settings: PluginSettings): SettingsResult {
	return { ok: true, settings: { ...settings, checkboxes: structuredClone(DEFAULT_CHECKBOXES) }, message: 'Checkbox configurations reset to defaults' };
}

/** Takes already-parsed and confirmed backup settings (see deserializeConfig) as the new settings. */
export function importSettings(imported: PluginSettings, checkboxCount: number): SettingsResult {
	return { ok: true, settings: imported, message: `Successfully imported ${checkboxCount} checkbox configurations!` };
}

export function setEnabled(settings: PluginSettings, enabled: boolean): SettingsResult {
	return { ok: true, settings: { ...settings, enabled }, message: enabled ? 'Custom checkboxes enabled' : 'Custom checkboxes disabled' };
}

/** Empty input falls back to the default. Silent: the field saves on every keystroke. */
export function setIconSize(settings: PluginSettings, iconSize: string): SettingsResult {
	return { ok: true, settings: { ...settings, iconSize: iconSize || DEFAULT_SETTINGS.iconSize } };
}

/** Empty input falls back to the default. Silent: the field saves on every keystroke. */
export function setIconPosition(settings: PluginSettings, iconPosition: string): SettingsResult {
	return { ok: true, settings: { ...settings, iconPosition: iconPosition || DEFAULT_SETTINGS.iconPosition } };
}
