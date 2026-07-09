import { Notice, Plugin } from 'obsidian';
import type { CheckboxConfig, PluginSettings } from './types';
import { DEFAULT_CHECKBOXES, DEFAULT_SETTINGS } from './defaults';
import { CheckboxManagerSettingTab } from './settings-tab';
import { InsertCheckboxModal } from './insert-checkbox-modal';
import { generateCheckboxCSS } from './css-generator';

export default class CheckboxManagerPlugin extends Plugin {
	settings!: PluginSettings;
	private styleEl!: HTMLStyleElement;

	async onload() {
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
				this.settings.checkboxes = [...DEFAULT_CHECKBOXES];
				await this.saveSettings();
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
	}

	async loadSettings() {
		const loadedData = (await this.loadData()) as Partial<PluginSettings>;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

		if (this.settings.checkboxes) {
			this.settings.checkboxes = this.settings.checkboxes.map((checkbox) => {
				const result = { ...checkbox };
				if (!result.viewBox) result.viewBox = '0 0 512 512';
				if (!result.customIconData) {
					const def = DEFAULT_CHECKBOXES.find((d) => d.symbol === result.symbol);
					if (def?.customIconData) result.customIconData = def.customIconData;
				}
				return result;
			});
		}

		if (!this.settings.iconStyle) {
			this.settings.iconStyle = 'stroke';
		}
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

	addCheckbox(config: CheckboxConfig) {
		if (!this.settings.checkboxes.find((cb) => cb.symbol === config.symbol)) {
			this.settings.checkboxes.push(config);
			void this.saveSettings();
		}
	}

	removeCheckbox(symbol: string) {
		this.settings.checkboxes = this.settings.checkboxes.filter((cb) => cb.symbol !== symbol);
		void this.saveSettings();
	}

	updateCheckbox(symbol: string, config: Partial<CheckboxConfig>) {
		const index = this.settings.checkboxes.findIndex((cb) => cb.symbol === symbol);
		if (index !== -1) {
			this.settings.checkboxes[index] = { ...this.settings.checkboxes[index], ...config };
			void this.saveSettings();
		}
	}
}
