import { Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface CustomIconData {
	viewBox: string;
	paths?: string[];
	elements?: string[];
}

interface CheckboxConfig {
	symbol: string;
	name: string;
	color: string;
	icon: string;
	viewBox: string;
	customIconData?: CustomIconData;
	description: string;
}

interface PluginSettings {
	checkboxes: CheckboxConfig[];
	enabled: boolean;
	iconSize: string;
	iconPosition: string;
	iconStyle: 'stroke' | 'filled';
}

const DEFAULT_CHECKBOXES: CheckboxConfig[] = [
	{
		symbol: '!',
		name: 'Important',
		color: 'var(--color-orange)',
		icon: 'M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32z',
		viewBox: '0 0 512 512',
		customIconData: { viewBox: '0 0 24 24', paths: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4m0 4h.01'] },
		description: 'Important task',
	},
	{
		symbol: '?',
		name: 'Question',
		color: 'var(--color-orange)',
		icon: 'M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM169.8 165.3c7.9-22.3 29.1-37.3 52.8-37.3h58.3c34.9 0 63.1 28.3 63.1 63.1c0 22.6-12.1 43.5-31.7 54.8L280 264.4c-.2 13-10.9 23.6-24 23.6c-13.3 0-24-10.7-24-24V250.5c0-8.6 4.6-16.5 12.1-20.8l44.3-25.4c4.7-2.7 7.6-7.7 7.6-13.1c0-8.4-6.8-15.1-15.1-15.1H222.6c-3.4 0-6.4 2.1-7.5 5.3l-.4 1.2c-4.4 12.5-18.2 19-30.6 14.6s-19-18.2-14.6-30.6l.4-1.2zM288 352c0 17.7-14.3 32-32 32s-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32z',
		viewBox: '0 0 512 512',
		customIconData: { viewBox: '0 0 24 24', paths: ['M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20ZM12 8v4m0 4h.01'] },
		description: 'Question or uncertain',
	},
	{
		symbol: '*',
		name: 'Star',
		color: 'var(--color-yellow)',
		icon: 'M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z',
		viewBox: '0 0 576 512',
		customIconData: { viewBox: '0 0 24 24', paths: ['m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'] },
		description: 'Starred/Favorite',
	},
	{
		symbol: '-',
		name: 'Cancelled',
		color: 'var(--color-red)',
		icon: 'M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM184 232H328c13.3 0 24 10.7 24 24s-10.7 24-24 24H184c-13.3 0-24-10.7-24-24s10.7-24 24-24z',
		viewBox: '0 0 512 512',
		customIconData: { viewBox: '0 0 24 24', paths: ['M18 6 6 18M6 6l12 12'] },
		description: 'Cancelled task',
	},
	{
		symbol: '>',
		name: 'Rescheduled',
		color: 'var(--color-blue)',
		icon: 'M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z',
		viewBox: '0 0 512 512',
		customIconData: { viewBox: '0 0 24 24', paths: ['M5 12h14m-7-7 7 7-7 7'] },
		description: 'Rescheduled/Moved',
	},
	{
		symbol: '<',
		name: 'Scheduled',
		color: 'var(--color-purple)',
		icon: 'M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192zm80 64c-8.8 0-16 7.2-16 16v96c0 8.8 7.2 16 16 16h96c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H80z',
		viewBox: '0 0 448 512',
		customIconData: { viewBox: '0 0 24 24', paths: ['M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'] },
		description: 'Scheduled',
	},
	{
		symbol: 'C',
		name: 'Code',
		color: 'var(--color-base-60)',
		icon: 'M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z',
		viewBox: '0 0 640 512',
		customIconData: { viewBox: '0 0 24 24', paths: ['m16 18 6-6-6-6', 'm8 6-6 6 6 6'] },
		description: 'Code',
	},
	{
		symbol: '/',
		name: 'In Progress',
		color: 'var(--background-modifier-accent)',
		icon: 'M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.8zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z',
		viewBox: '0 0 512 512',
		customIconData: { viewBox: '0 0 24 24', paths: ['M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83'] },
		description: 'Task in progress',
	},
];

const DEFAULT_SETTINGS: PluginSettings = {
	checkboxes: DEFAULT_CHECKBOXES,
	enabled: true,
	iconSize: '90%',
	iconPosition: '50% 50%',
	iconStyle: 'stroke',
};

export default class CheckboxManagerPlugin extends Plugin {
	settings!: PluginSettings;
	private styleEl!: HTMLStyleElement;

	async onload() {
		await this.loadSettings();

		this.styleEl = document.createElement('style');
		this.styleEl.id = 'checkbox-manager-styles';
		document.head.appendChild(this.styleEl);

		this.updateStyles();

		this.addSettingTab(new CheckboxManagerSettingTab(this.app, this));

		this.addCommand({
			id: 'toggle-custom-checkboxes',
			name: 'Toggle Custom Checkboxes',
			callback: () => {
				this.settings.enabled = !this.settings.enabled;
				this.saveSettings();
				this.updateStyles();
				new Notice(this.settings.enabled ? 'Custom checkboxes enabled' : 'Custom checkboxes disabled');
			},
		});

		this.addCommand({
			id: 'refresh-checkbox-styles',
			name: 'Refresh Checkbox Styles',
			callback: () => {
				this.updateStyles();
				new Notice('Checkbox styles refreshed');
			},
		});

		this.addCommand({
			id: 'reset-to-defaults',
			name: 'Reset Checkboxes to Defaults',
			callback: async () => {
				this.settings.checkboxes = [...DEFAULT_CHECKBOXES];
				await this.saveSettings();
				new Notice('Reset to default checkboxes');
			},
		});
	}

	onunload() {
		this.styleEl?.remove();
	}

	async loadSettings() {
		const loadedData = await this.loadData();
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
			this.saveSettings();
		}
	}

	removeCheckbox(symbol: string) {
		this.settings.checkboxes = this.settings.checkboxes.filter((cb) => cb.symbol !== symbol);
		this.saveSettings();
	}

	updateCheckbox(symbol: string, config: Partial<CheckboxConfig>) {
		const index = this.settings.checkboxes.findIndex((cb) => cb.symbol === symbol);
		if (index !== -1) {
			this.settings.checkboxes[index] = { ...this.settings.checkboxes[index], ...config };
			this.saveSettings();
		}
	}
}

class CheckboxManagerSettingTab extends PluginSettingTab {
	plugin: CheckboxManagerPlugin;

	constructor(app: import('obsidian').App, plugin: CheckboxManagerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Checkbox Manager Settings' });

		new Setting(containerEl)
			.setName('Enable Custom Checkboxes')
			.setDesc('Toggle custom checkbox styling on/off')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enabled).onChange(async (value) => {
					this.plugin.settings.enabled = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Icon Style')
			.setDesc("Filled: bold FontAwesome icons. Stroke: thin Lucide icons that match Obsidian's UI.")
			.addDropdown((dropdown) => {
				dropdown.addOption('stroke', 'Stroke (Lucide)');
				dropdown.addOption('filled', 'Filled (FontAwesome)');
				dropdown.setValue(this.plugin.settings.iconStyle || 'stroke');
				dropdown.onChange(async (value) => {
					this.plugin.settings.iconStyle = value as 'stroke' | 'filled';
					await this.plugin.saveSettings();
					this.display();
					new Notice(`Icon style changed to ${value}`);
				});
			});

		containerEl.createEl('h3', { text: 'Global Settings' });

		new Setting(containerEl)
			.setName('Icon Size')
			.setDesc('Size of checkbox icons (CSS value, e.g., 90%, 16px, 1.2em)')
			.addText((text) =>
				text
					.setPlaceholder('90%')
					.setValue(this.plugin.settings.iconSize)
					.onChange(async (value) => {
						this.plugin.settings.iconSize = value || '90%';
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Icon Position')
			.setDesc('Position of checkbox icons (CSS background-position, e.g., center, 50% 50%)')
			.addText((text) =>
				text
					.setPlaceholder('50% 50%')
					.setValue(this.plugin.settings.iconPosition)
					.onChange(async (value) => {
						this.plugin.settings.iconPosition = value || '50% 50%';
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl('h3', { text: 'Checkbox Configurations' });

		new Setting(containerEl)
			.setName('Add New Checkbox')
			.setDesc('Add a new custom checkbox type')
			.addButton((button) =>
				button
					.setButtonText('Add Checkbox')
					.setCta()
					.onClick(() => this.showAddCheckboxModal())
			);

		this.plugin.settings.checkboxes.forEach((checkbox, index) => {
			const item = containerEl.createDiv('checkbox-item');
			item.draggable = true;
			item.dataset.index = index.toString();
			item.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: grab;
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        margin-bottom: 4px;
        padding: 8px 12px;
        transition: all 0.2s ease;
        min-height: 40px;
      `;

			item.addEventListener('dragstart', (e) => {
				item.style.opacity = '0.5';
				item.style.cursor = 'grabbing';
				e.dataTransfer!.effectAllowed = 'move';
				e.dataTransfer!.setData('text/plain', index.toString());
			});

			item.addEventListener('dragend', () => {
				item.style.opacity = '1';
				item.style.cursor = 'grab';
				containerEl.querySelectorAll('.checkbox-item').forEach((el) => {
					(el as HTMLElement).style.borderColor = 'var(--background-modifier-border)';
					(el as HTMLElement).style.background = '';
				});
			});

			item.addEventListener('dragover', (e) => {
				e.preventDefault();
				e.dataTransfer!.dropEffect = 'move';
				item.style.borderColor = 'var(--interactive-accent)';
				item.style.background = 'var(--background-secondary)';
			});

			item.addEventListener('dragleave', (e) => {
				if (!item.contains(e.relatedTarget as Node)) {
					item.style.borderColor = 'var(--background-modifier-border)';
					item.style.background = '';
				}
			});

			item.addEventListener('drop', async (e) => {
				e.preventDefault();
				const from = parseInt(e.dataTransfer!.getData('text/plain'));
				const to = parseInt(item.dataset.index!);
				if (from !== to) {
					const list = [...this.plugin.settings.checkboxes];
					const [moved] = list.splice(from, 1);
					list.splice(to, 0, moved);
					this.plugin.settings.checkboxes = list;
					await this.plugin.saveSettings();
					this.display();
					new Notice(`Moved "${moved.name}" to position ${to + 1}`);
				}
				item.style.borderColor = 'var(--background-modifier-border)';
				item.style.background = '';
			});

			const preview = item.createDiv();
			preview.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 8px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        background: var(--background-secondary);
        min-width: 140px;
        flex: 1;
      `;

			const symbolEl = preview.createSpan();
			symbolEl.textContent = `[${checkbox.symbol}]`;
			symbolEl.style.cssText = `font-family: var(--font-monospace); font-size: 13px; color: ${checkbox.color}; font-weight: bold; flex-shrink: 0;`;

			const iconEl = preview.createSpan();
			iconEl.style.cssText = 'flex-shrink: 0;';
			const previewStyle = this.plugin.settings.iconStyle || 'stroke';
			if (previewStyle === 'filled' && checkbox.icon) {
				iconEl.innerHTML = `<svg width="16" height="16" viewBox="${checkbox.viewBox || '0 0 512 512'}" fill="${checkbox.color}"><path d="${checkbox.icon}"/></svg>`;
			} else if (checkbox.customIconData) {
				const svgEls = checkbox.customIconData.elements
					? checkbox.customIconData.elements.join('')
					: (checkbox.customIconData.paths || []).map((d) => `<path d="${d}"/>`).join('');
				if (svgEls) {
					iconEl.innerHTML = `<svg width="16" height="16" viewBox="${checkbox.customIconData.viewBox}" fill="none" stroke="${checkbox.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgEls}</svg>`;
				}
			} else if (checkbox.icon) {
				iconEl.innerHTML = `<svg width="16" height="16" viewBox="${checkbox.viewBox || '0 0 512 512'}" fill="${checkbox.color}"><path d="${checkbox.icon}"/></svg>`;
			}

			const nameEl = preview.createSpan();
			nameEl.textContent = checkbox.name;
			nameEl.style.cssText = `font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;`;

			const buttons = item.createDiv();
			buttons.style.cssText = 'display: flex; gap: 8px; flex-shrink: 0;';

			const editBtn = buttons.createEl('button', { text: 'Edit' });
			editBtn.style.cssText = `padding: 4px 12px; border: 1px solid var(--background-modifier-border); background: var(--background-primary); color: var(--text-normal); border-radius: 4px; cursor: pointer; font-size: 12px;`;
			editBtn.onclick = () => this.showEditCheckboxModal(checkbox, index);

			const delBtn = buttons.createEl('button', { text: 'Delete' });
			delBtn.style.cssText = `padding: 4px 12px; border: 1px solid var(--color-red); background: var(--color-red); color: white; border-radius: 4px; cursor: pointer; font-size: 12px;`;
			delBtn.onclick = async () => {
				if (confirm(`Delete checkbox "${checkbox.name}" [${checkbox.symbol}]?`)) {
					this.plugin.settings.checkboxes.splice(index, 1);
					await this.plugin.saveSettings();
					this.display();
					new Notice(`Deleted checkbox: ${checkbox.name}`);
				}
			};
		});

		new Setting(containerEl)
			.setName('Reset to Defaults')
			.setDesc('Reset all checkbox configurations to default values')
			.addButton((button) =>
				button
					.setButtonText('Reset')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.checkboxes = [...DEFAULT_CHECKBOXES];
						await this.plugin.saveSettings();
						this.display();
						new Notice('Checkbox configurations reset to defaults');
					})
			);

		containerEl.createEl('h3', { text: 'Backup & Restore' });

		new Setting(containerEl)
			.setName('Export Configuration')
			.setDesc('Download your current checkbox configuration as a backup file')
			.addButton((button) =>
				button
					.setButtonText('Export')
					.setCta()
					.onClick(() => this.exportConfiguration())
			);

		new Setting(containerEl)
			.setName('Import Configuration')
			.setDesc('Restore checkbox configuration from a backup file')
			.addButton((button) =>
				button.setButtonText('Import').onClick(() => this.importConfiguration())
			);
	}

	private exportConfiguration() {
		const config = {
			version: '2.0',
			plugin: 'obsidian-checkbox-manager',
			timestamp: new Date().toISOString(),
			settings: this.plugin.settings,
		};
		const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `checkbox-manager-${new Date().toISOString().split('T')[0]}.json`;
		link.click();
		new Notice('Configuration exported successfully!');
	}

	private importConfiguration() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			try {
				const imported = JSON.parse(await file.text());
				if (!imported.settings?.checkboxes) {
					new Notice('Invalid configuration file format');
					return;
				}
				if (confirm(`Import ${imported.settings.checkboxes.length} checkbox configurations?\n\nThis will replace your current settings.\nExported on: ${imported.timestamp || 'Unknown date'}`)) {
					this.plugin.settings = { ...this.plugin.settings, ...imported.settings };
					await this.plugin.saveSettings();
					this.display();
					new Notice(`Successfully imported ${imported.settings.checkboxes.length} checkbox configurations!`);
				}
			} catch (error) {
				new Notice('Error reading configuration file: ' + (error as Error).message);
			}
		};
		input.click();
	}

	private showAddCheckboxModal() {
		new CheckboxConfigModal(this.app, this.plugin, null, (result) => {
			if (result) {
				this.plugin.addCheckbox(result);
				this.display();
				new Notice(`Added checkbox: [${result.symbol}] ${result.name}`);
			}
		}).open();
	}

	private showEditCheckboxModal(checkbox: CheckboxConfig, index: number) {
		new CheckboxConfigModal(this.app, this.plugin, checkbox, (result) => {
			if (result) {
				this.plugin.settings.checkboxes[index] = result;
				this.plugin.saveSettings();
				this.display();
				new Notice(`Updated checkbox: [${result.symbol}] ${result.name}`);
			}
		}).open();
	}
}

class CheckboxConfigModal extends Modal {
	private plugin: CheckboxManagerPlugin;
	private config: CheckboxConfig | null;
	private onSubmit: (result: CheckboxConfig | null) => void;

	constructor(
		app: import('obsidian').App,
		plugin: CheckboxManagerPlugin,
		config: CheckboxConfig | null,
		onSubmit: (result: CheckboxConfig | null) => void
	) {
		super(app);
		this.plugin = plugin;
		this.config = config;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		const isFilled = (this.plugin.settings.iconStyle || 'stroke') === 'filled';

		this.modalEl.style.maxWidth = '500px';
		this.modalEl.style.width = '90vw';

		contentEl.createEl('h2', {
			text: this.config ? 'Edit Checkbox' : 'Add New Checkbox',
			attr: { style: 'margin-bottom: 24px; text-align: center;' },
		});

		const form = contentEl.createDiv();

		let symbol = this.config?.symbol || '';
		let name = this.config?.name || '';
		let color = this.config?.color || 'var(--color-orange)';
		let icon = this.config?.icon || '';
		let viewBox = this.config?.viewBox || '0 0 512 512';
		let customIconData: CustomIconData | null = this.config?.customIconData ?? null;

		new Setting(form)
			.setName('Symbol')
			.setDesc('Single character used in [x]')
			.addText((text) =>
				text.setPlaceholder('!').setValue(symbol).onChange((v) => {
					symbol = v;
					updatePreview();
				})
			);

		new Setting(form)
			.setName('Name')
			.setDesc('Display name for this checkbox type')
			.addText((text) =>
				text.setPlaceholder('Important').setValue(name).onChange((v) => {
					name = v;
					updatePreview();
				})
			);

		new Setting(form)
			.setName('Color')
			.setDesc('Icon color')
			.addDropdown((dropdown) => {
				dropdown.addOption('var(--color-orange)', 'Orange');
				dropdown.addOption('var(--color-red)', 'Red');
				dropdown.addOption('var(--color-green)', 'Green');
				dropdown.addOption('var(--color-blue)', 'Blue');
				dropdown.addOption('var(--color-purple)', 'Purple');
				dropdown.addOption('var(--color-yellow)', 'Yellow');
				dropdown.addOption('var(--color-pink)', 'Pink');
				dropdown.addOption('var(--color-cyan)', 'Cyan');
				dropdown.addOption('var(--color-base-60)', 'Gray');
				dropdown.addOption('var(--background-modifier-accent)', 'Accent');
				dropdown.addOption('var(--color-base-100)', 'Default');
				dropdown.setValue(color);
				dropdown.onChange((v) => {
					color = v;
					updatePreview();
				});
			});

		const iconSection = form.createDiv();
		iconSection.style.cssText = 'margin: 20px 0; padding: 16px; background: var(--background-secondary); border-radius: 8px;';

		if (isFilled) {
			iconSection.createEl('h3', { text: 'Icon (FontAwesome/Filled)', attr: { style: 'margin: 0 0 8px 0; font-size: 16px;' } });
			const helper = iconSection.createEl('div', { attr: { style: 'font-size: 12px; color: var(--text-muted); margin-bottom: 12px;' } });
			helper.innerHTML = `Go to <a href="https://fontawesome.com/icons" target="_blank" style="color: var(--link-color);">fontawesome.com</a>, find an icon, click <strong>SVG</strong> → copy and paste the full SVG below`;

			const svgAreaFilled = iconSection.createEl('textarea');
			svgAreaFilled.style.cssText = 'width: 100%; height: 120px; font-family: var(--font-monospace); font-size: 11px; padding: 12px; border: 1px solid var(--background-modifier-border); border-radius: 6px; background: var(--background-primary); resize: vertical; box-sizing: border-box;';
			svgAreaFilled.placeholder = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n  <path d="M256 32c14.2 0..."/>\n</svg>';

			if (icon) {
				svgAreaFilled.value = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">\n  <path d="${icon}"/>\n</svg>`;
			}

			const extractedInfo = iconSection.createEl('div', { attr: { style: 'font-size: 11px; color: var(--text-muted); margin-top: 6px; font-family: var(--font-monospace);' } });

			svgAreaFilled.oninput = () => {
				const val = svgAreaFilled.value.trim();
				if (!val) {
					icon = '';
					extractedInfo.textContent = '';
					svgAreaFilled.style.borderColor = 'var(--background-modifier-border)';
					updatePreview();
					return;
				}
				try {
					if (!val.startsWith('<svg')) throw new Error('Not an SVG');
					const doc = new DOMParser().parseFromString(val, 'image/svg+xml');
					const svg = doc.querySelector('svg');
					if (!svg) throw new Error('No SVG element');
					const paths = Array.from(svg.querySelectorAll('path'));
					if (!paths.length) throw new Error('No path elements');
					icon = paths.map((p) => p.getAttribute('d')).filter(Boolean).join(' ');
					viewBox = svg.getAttribute('viewBox') || '0 0 512 512';
					extractedInfo.textContent = `viewBox: ${viewBox} · ${paths.length} path${paths.length > 1 ? 's' : ''} extracted`;
					svgAreaFilled.style.borderColor = 'var(--color-green)';
					updatePreview();
				} catch {
					icon = '';
					extractedInfo.textContent = 'Could not parse SVG';
					svgAreaFilled.style.borderColor = 'var(--color-red)';
					updatePreview();
				}
			};
		} else {
			iconSection.createEl('h3', { text: 'Icon (Lucide/Stroke)', attr: { style: 'margin: 0 0 8px 0; font-size: 16px;' } });
			const helper = iconSection.createEl('div', { attr: { style: 'font-size: 12px; color: var(--text-muted); margin-bottom: 12px;' } });
			helper.innerHTML = `Go to <a href="https://lucide.dev/icons" target="_blank" style="color: var(--link-color);">lucide.dev</a>, search for an icon, copy the SVG, and paste it below`;

			const svgArea = iconSection.createEl('textarea');
			svgArea.style.cssText = 'width: 100%; height: 120px; font-family: var(--font-monospace); font-size: 11px; padding: 12px; border: 1px solid var(--background-modifier-border); border-radius: 6px; background: var(--background-primary); resize: vertical; box-sizing: border-box;';
			svgArea.placeholder = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ...>\n  <path d="..."/>\n</svg>';

			if (customIconData?.paths) {
				const paths = customIconData.paths.map((d) => `<path d="${d}"/>`).join('\n  ');
				svgArea.value = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${customIconData.viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n  ${paths}\n</svg>`;
			} else if (customIconData?.elements) {
				svgArea.value = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${customIconData.viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n  ${customIconData.elements.join('\n  ')}\n</svg>`;
			}

			svgArea.oninput = () => {
				const val = svgArea.value.trim();
				if (!val) {
					customIconData = null;
					svgArea.style.borderColor = 'var(--background-modifier-border)';
					updatePreview();
					return;
				}
				try {
					if (!val.startsWith('<svg')) throw new Error('Not an SVG');
					const doc = new DOMParser().parseFromString(val, 'image/svg+xml');
					const svg = doc.querySelector('svg');
					if (!svg) throw new Error('No SVG element');
					const vb = svg.getAttribute('viewBox') || '0 0 24 24';
					const els = Array.from(svg.querySelectorAll('path, circle, rect, line, polyline, polygon, ellipse'));
					if (!els.length) throw new Error('No drawable elements');
					customIconData = { viewBox: vb, elements: els.map((el) => el.outerHTML) };
					svgArea.style.borderColor = 'var(--color-green)';
					updatePreview();
				} catch {
					customIconData = null;
					svgArea.style.borderColor = 'var(--color-red)';
					updatePreview();
				}
			};
		}

		const previewSection = form.createDiv();
		previewSection.style.cssText = 'margin: 20px 0; padding: 16px; background: var(--background-secondary); border-radius: 8px; border: 2px solid var(--background-modifier-border);';
		previewSection.createEl('h3', { text: 'Preview', attr: { style: 'margin: 0 0 12px 0; font-size: 16px;' } });
		const previewContent = previewSection.createDiv();

		let saveButton: HTMLButtonElement;

		const updatePreview = () => {
			const hasIcon = isFilled ? !!icon : !!(customIconData?.paths || customIconData?.elements);
			if (symbol && name && hasIcon) {
				let iconHtml = '';
				if (isFilled && icon) {
					iconHtml = `<svg width="20" height="20" viewBox="${viewBox}" fill="${color}"><path d="${icon}"/></svg>`;
				} else if (customIconData) {
					const svgEls = customIconData.elements
						? customIconData.elements.join('')
						: (customIconData.paths || []).map((d) => `<path d="${d}"/>`).join('');
					iconHtml = `<svg width="20" height="20" viewBox="${customIconData.viewBox}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgEls}</svg>`;
				}
				previewContent.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--background-primary); border-radius: 6px;">
            <span style="font-family: var(--font-monospace); font-size: 14px; background: var(--background-modifier-hover); padding: 4px 8px; border-radius: 4px; font-weight: bold;">[${symbol}]</span>
            ${iconHtml}
            <div style="font-weight: 500;">${name}</div>
          </div>`;
				previewSection.style.borderColor = 'var(--color-green)';
				saveButton.disabled = false;
				saveButton.style.opacity = '1';
			} else {
				const missing = [];
				if (!symbol) missing.push('symbol');
				if (!name) missing.push('name');
				if (!hasIcon) missing.push('icon');
				previewContent.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 16px; font-style: italic;">${missing.length ? `Missing: ${missing.join(', ')}` : 'Fill in the fields above'}</div>`;
				previewSection.style.borderColor = 'var(--background-modifier-border)';
				saveButton.disabled = true;
				saveButton.style.opacity = '0.5';
			}
		};

		const buttonContainer = form.createDiv();
		buttonContainer.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--background-modifier-border);';

		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelButton.style.cssText = 'padding: 10px 20px; border: 1px solid var(--background-modifier-border); background: var(--background-primary); color: var(--text-normal); border-radius: 6px; cursor: pointer;';
		cancelButton.onclick = () => { this.onSubmit(null); this.close(); };

		saveButton = buttonContainer.createEl('button', { text: 'Save' });
		saveButton.style.cssText = 'padding: 10px 24px; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 6px; cursor: pointer; font-weight: 500;';
		saveButton.disabled = true;
		saveButton.style.opacity = '0.5';
		saveButton.onclick = () => {
			if (!symbol || !name) {
				new Notice('Symbol and Name are required');
				return;
			}
			const result: CheckboxConfig = {
				symbol: symbol.trim(),
				name: name.trim(),
				color: color.trim(),
				description: this.config?.description || '',
				icon: '',
				viewBox: '0 0 512 512',
			};
			if (isFilled) {
				result.icon = icon.trim();
				result.viewBox = viewBox.trim() || '0 0 512 512';
				if (this.config?.customIconData) result.customIconData = this.config.customIconData;
			} else {
				result.customIconData = customIconData ?? undefined;
				result.icon = this.config?.icon || '';
				result.viewBox = this.config?.viewBox || '0 0 512 512';
			}
			this.onSubmit(result);
			this.close();
		};

		updatePreview();
	}

	onClose() {
		this.contentEl.empty();
	}
}
