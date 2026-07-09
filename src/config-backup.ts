import type { PluginSettings } from './types';

const CONFIG_VERSION = '2.0';
const PLUGIN_ID = 'obsidian-checkbox-manager';

interface BackupFile {
	version: string;
	plugin: string;
	timestamp: string;
	settings: Partial<PluginSettings>;
}

export type DeserializeResult =
	| { ok: true; settings: PluginSettings; checkboxCount: number; timestamp?: string }
	| { ok: false; reason: string };

/** Serializes the plugin's settings into a backup file's JSON text. */
export function serializeConfig(settings: PluginSettings, exportedAt: Date): string {
	const backup: BackupFile = {
		version: CONFIG_VERSION,
		plugin: PLUGIN_ID,
		timestamp: exportedAt.toISOString(),
		settings,
	};
	return JSON.stringify(backup, null, 2);
}

/** Suggests a download filename for a backup exported at the given date. */
export function suggestFilename(exportedAt: Date): string {
	return `checkbox-manager-${exportedAt.toISOString().split('T')[0]}.json`;
}

/**
 * Parses and validates a backup file's JSON text, merging it over currentSettings.
 * Any field absent from the backup (e.g. an older export missing a newer setting)
 * falls back to currentSettings, matching the shallow-merge semantics import always had.
 */
export function deserializeConfig(json: string, currentSettings: PluginSettings): DeserializeResult {
	let parsed: Partial<BackupFile>;
	try {
		parsed = JSON.parse(json) as Partial<BackupFile>;
	} catch (error) {
		return { ok: false, reason: 'Error reading configuration file: ' + (error as Error).message };
	}

	const checkboxes = parsed.settings?.checkboxes;
	if (!Array.isArray(checkboxes)) {
		return { ok: false, reason: 'Invalid configuration file format' };
	}

	for (let i = 0; i < checkboxes.length; i++) {
		const cb = checkboxes[i] as Partial<PluginSettings['checkboxes'][number]>;
		if (!cb.symbol) return { ok: false, reason: `checkbox ${i + 1} is missing a symbol` };
		if (!cb.name) return { ok: false, reason: `checkbox ${i + 1} is missing a name` };
	}

	return {
		ok: true,
		settings: { ...currentSettings, ...parsed.settings },
		checkboxCount: checkboxes.length,
		timestamp: parsed.timestamp,
	};
}
