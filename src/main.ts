import { Notice, Plugin } from 'obsidian';
import type { CheckboxConfig, PluginSettings } from './types';
import { normalizeSettings, resetCheckboxes } from './settings';
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
			callback: () => {
				this.settings.enabled = !this.settings.enabled;
				void this.saveSettings();
				new Notice(this.settings.enabled ? 'Custom checkboxes enabled' : 'Custom checkboxes disabled');
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
				await this.resetCheckboxes();
				new Notice('Reset to default checkboxes');
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

	/** Applies a list operation's result: on success, stores the new list, saves and restyles. Returns the result for the caller to report. */
	private async applyCheckboxResult(result: ListResult): Promise<ListResult> {
		if (result.ok) {
			this.settings.checkboxes = result.list;
			await this.saveSettings();
		}
		return result;
	}

	addCheckbox(config: CheckboxConfig) {
		return this.applyCheckboxResult(checkboxList.addCheckbox(this.settings.checkboxes, config));
	}

	removeCheckbox(symbol: string) {
		return this.applyCheckboxResult(checkboxList.removeCheckbox(this.settings.checkboxes, symbol));
	}

	updateCheckbox(symbol: string, config: CheckboxConfig) {
		return this.applyCheckboxResult(checkboxList.updateCheckbox(this.settings.checkboxes, symbol, config));
	}

	reorderCheckbox(from: number, to: number) {
		return this.applyCheckboxResult(checkboxList.reorderCheckboxes(this.settings.checkboxes, from, to));
	}

	async resetCheckboxes() {
		this.settings = resetCheckboxes(this.settings);
		await this.saveSettings();
	}

	async replaceSettings(next: PluginSettings) {
		this.settings = next;
		await this.saveSettings();
	}
}
