import { Notice, Plugin } from 'obsidian';
import type { CheckboxConfig, PluginSettings } from './types';
import { importSettings, normalizeSettings, resetCheckboxes, setEnabled, setIconPosition, setIconSize, type SettingsResult } from './settings';
import { CheckboxManagerSettingTab } from './settings-tab';
import { InsertCheckboxModal } from './insert-checkbox-modal';
import { generateCheckboxCSS } from './css-generator';
import { registerLucideIcons, unregisterLucideIcons } from './lucide-icons';
import * as checkboxList from './checkbox-list';
import type { ListResult } from './checkbox-list';

export default class CheckboxManagerPlugin extends Plugin {
	settings!: PluginSettings;
	private styleEl!: HTMLStyleElement;

	async onload() {
		registerLucideIcons();
		await this.loadSettings();

		this.styleEl = createEl('style');
		this.styleEl.id = 'checkbox-manager-styles';
		document.head.appendChild(this.styleEl);

		this.addSettingTab(new CheckboxManagerSettingTab(this.app, this));

		this.addCommand({
			id: 'toggle-custom-checkboxes',
			name: 'Toggle custom checkboxes',
			callback: async () => {
				this.notify(await this.setEnabled(!this.settings.enabled));
			},
		});

		this.addCommand({
			id: 'refresh-checkbox-styles',
			name: 'Refresh checkbox styles',
			callback: () => {
				this.updateStyles();
				new Notice('Checkbox styles refreshed');
			},
		});

		this.addCommand({
			id: 'reset-to-defaults',
			name: 'Reset checkboxes to defaults',
			callback: async () => {
				this.notify(await this.resetCheckboxes());
			},
		});

		this.addCommand({
			id: 'insert-checkbox',
			name: 'Insert checkbox',
			editorCallback: (editor) => {
				new InsertCheckboxModal(this.app, this, editor).open();
			},
		});

		this.app.workspace.onLayoutReady(() => {
			this.updateStyles();
		});
	}

	onunload() {
		this.styleEl?.remove();
		unregisterLucideIcons();
	}

	async loadSettings() {
		this.settings = normalizeSettings((await this.loadData()) as Partial<PluginSettings> | null);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.updateStyles();
	}

	updateStyles() {
		if (this.styleEl) {
			this.styleEl.textContent = generateCheckboxCSS(this.settings);
		}
	}

	/** Shows a result's Notice: its message on success (nothing when absent), or the refusal reason. */
	notify(result: SettingsResult): void {
		if (!result.ok) new Notice(result.reason);
		else if (result.message) new Notice(result.message);
	}

	/** Applies an operation's result: on success, stores the new settings, saves and restyles. Returns the result for the caller to report. */
	private async apply(result: SettingsResult): Promise<SettingsResult> {
		if (result.ok) {
			this.settings = result.settings;
			await this.saveSettings();
		}
		return result;
	}

	private applyList(result: ListResult): Promise<SettingsResult> {
		return this.apply(result.ok ? { ok: true, settings: { ...this.settings, checkboxes: result.list }, message: result.message } : result);
	}

	addCheckbox(config: CheckboxConfig) {
		return this.applyList(checkboxList.addCheckbox(this.settings.checkboxes, config));
	}

	removeCheckbox(symbol: string) {
		return this.applyList(checkboxList.removeCheckbox(this.settings.checkboxes, symbol));
	}

	updateCheckbox(symbol: string, config: CheckboxConfig) {
		return this.applyList(checkboxList.updateCheckbox(this.settings.checkboxes, symbol, config));
	}

	reorderCheckbox(from: number, to: number) {
		return this.applyList(checkboxList.reorderCheckboxes(this.settings.checkboxes, from, to));
	}

	resetCheckboxes() {
		return this.apply(resetCheckboxes(this.settings));
	}

	replaceSettings(imported: PluginSettings, checkboxCount: number) {
		return this.apply(importSettings(imported, checkboxCount));
	}

	setEnabled(enabled: boolean) {
		return this.apply(setEnabled(this.settings, enabled));
	}

	setIconSize(iconSize: string) {
		return this.apply(setIconSize(this.settings, iconSize));
	}

	setIconPosition(iconPosition: string) {
		return this.apply(setIconPosition(this.settings, iconPosition));
	}
}
