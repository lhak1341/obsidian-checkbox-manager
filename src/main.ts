import { Notice, Plugin } from 'obsidian';
import type { CheckboxConfig, PluginSettings } from './types';
import { DEFAULT_CHECKBOXES, DEFAULT_SETTINGS } from './defaults';
import { CheckboxManagerSettingTab } from './settings-tab';

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

	private isSel(symbol: string): string {
		return `:is(input[data-task='${symbol}'], [data-task='${symbol}'] > input, [data-task='${symbol}'] > p > input):checked`;
	}

	private varName(symbol: string): string {
		return `--cb-icon-${symbol.codePointAt(0)}`;
	}

	generateCheckboxCSS(): string {
		if (!this.settings.enabled) return '';

		const spinner = this.settings.checkboxes.find((cb) => cb.symbol === '/');
		const regular = this.settings.checkboxes.filter((cb) => cb.symbol !== '/');

		let css = `
/* Checkbox Manager Plugin Styles */
.markdown-preview-view .task-list-item-checkbox {
	position: relative;
	top: var(--checkbox-top);
	left: var(--checkbox-left);
}
.markdown-preview-view ul > li.task-list-item { text-indent: 0; }
input {
	-webkit-mask-size: ${this.settings.iconSize};
	-webkit-mask-repeat: no-repeat;
	-webkit-mask-position: ${this.settings.iconPosition};
}
`;

		const allCheckboxes = [...regular, ...(spinner ? [spinner] : [])];
		const iconVars = allCheckboxes
			.map((cb) => ({ cb, url: this.getIconUrl(cb) }))
			.filter(({ url }) => url !== 'none')
			.map(({ cb, url }) => `  ${this.varName(cb.symbol)}: ${url};`);

		if (iconVars.length) {
			css += `\n:root {\n${iconVars.join('\n')}\n}\n`;
		}

		if (regular.length) {
			css += `
/* Shared checkbox properties */
${regular.map((cb) => this.isSel(cb.symbol)).join(',\n')} {
	--checkbox-marker-color: transparent;
	border: none;
	border-radius: 0;
	background-image: none;
	background-color: currentColor;
	pointer-events: none;
}
`;
		}

		for (const cb of regular) {
			if (this.getIconUrl(cb) === 'none') continue;
			css += `
/* [${cb.symbol}] ${cb.name} */
${this.isSel(cb.symbol)} { color: ${cb.color}; -webkit-mask-image: var(${this.varName(cb.symbol)}); }
`;
		}

		if (spinner) {
			const spinUrl = this.getIconUrl(spinner);
			const maskProp = spinUrl !== 'none' ? `-webkit-mask-image: var(${this.varName('/')});` : '';
			css += `
/* [/] ${spinner.name} - Spinning */
${this.isSel('/')} {
	--checkbox-marker-color: transparent;
	border: none;
	border-radius: 0;
	background-image: none;
	background-color: currentColor;
	color: ${spinner.color};
	${maskProp}
	pointer-events: none;
	animation: spin 2s linear infinite;
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
		}

		return css;
	}

	getIconUrl(checkbox: CheckboxConfig): string {
		const style = this.settings.iconStyle || 'stroke';
		if (style === 'stroke') {
			return checkbox.customIconData
				? this.createLucideSVGDataURL(checkbox)
				: checkbox.icon ? this.createSVGDataURL(checkbox) : 'none';
		}
		return checkbox.icon ? this.createSVGDataURL(checkbox) : 'none';
	}

	private createSVGDataURL(checkbox: CheckboxConfig): string {
		if (!checkbox.icon) return 'none';
		const viewBox = checkbox.viewBox || '0 0 512 512';
		const svgContent = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}'><path d='${checkbox.icon}'/></svg>`;
		return `url("data:image/svg+xml,${encodeURIComponent(svgContent)}")`;
	}

	private createLucideSVGDataURL(checkbox: CheckboxConfig): string {
		if (!checkbox.customIconData) return 'none';
		const { customIconData: data } = checkbox;

		let svgElements = '';
		if (data.elements) {
			svgElements = data.elements.join('');
		} else if (data.paths) {
			svgElements = (Array.isArray(data.paths) ? data.paths : [data.paths])
				.map((d) => `<path d="${d}"></path>`)
				.join('');
		}

		if (!svgElements) return 'none';

		const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="${data.viewBox || '0 0 24 24'}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgElements}</svg>`;
		return `url("data:image/svg+xml,${encodeURIComponent(svgContent)}")`;
	}

	updateStyles() {
		if (this.styleEl) {
			this.styleEl.textContent = this.generateCheckboxCSS();
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
