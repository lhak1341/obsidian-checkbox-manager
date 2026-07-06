import { App, Notice, PluginSettingTab, Setting, sanitizeHTMLToDom } from 'obsidian';
import type { CheckboxConfig } from './types';
import type CheckboxManagerPlugin from './main';
import { CheckboxConfigModal } from './modal';
import { DEFAULT_CHECKBOXES } from './defaults';

export class CheckboxManagerSettingTab extends PluginSettingTab {
	plugin: CheckboxManagerPlugin;

	constructor(app: App, plugin: CheckboxManagerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		this.render();
	}

	render(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Enable custom checkboxes')
			.setDesc('Toggle custom checkbox styling on/off')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enabled).onChange(async (value) => {
					this.plugin.settings.enabled = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Icon style')
			.setDesc("Filled: bold fontawesome icons. Stroke: thin lucide icons that match Obsidian's UI.")
			.addDropdown((dropdown) => {
				dropdown.addOption('stroke', 'Stroke (lucide)');
				dropdown.addOption('filled', 'Filled (fontawesome)');
				dropdown.setValue(this.plugin.settings.iconStyle || 'stroke');
				dropdown.onChange(async (value) => {
					this.plugin.settings.iconStyle = value as 'stroke' | 'filled';
					await this.plugin.saveSettings();
					this.render();
					new Notice(`Icon style changed to ${value}`);
				});
			});

		new Setting(containerEl)
			.setName('Icon size')
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
			.setName('Icon position')
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

		new Setting(containerEl).setName('Checkbox configurations').setHeading();

		new Setting(containerEl)
			.setName('Add new checkbox')
			.setDesc('Add a new custom checkbox type')
			.addButton((button) =>
				button
					.setButtonText('Add checkbox')
					.setCta()
					.onClick(() => this.showAddCheckboxModal())
			);

		this.plugin.settings.checkboxes.forEach((checkbox, index) => {
			const item = containerEl.createDiv('checkbox-manager-item');
			item.draggable = true;
			item.dataset.index = index.toString();

			item.addEventListener('dragstart', (e) => {
				item.addClass('is-dragging');
				e.dataTransfer!.effectAllowed = 'move';
				e.dataTransfer!.setData('text/plain', index.toString());
			});

			item.addEventListener('dragend', () => {
				item.removeClass('is-dragging');
				containerEl.querySelectorAll<HTMLElement>('.checkbox-manager-item').forEach((el) => {
					el.removeClass('is-drag-over');
				});
			});

			item.addEventListener('dragover', (e) => {
				e.preventDefault();
				e.dataTransfer!.dropEffect = 'move';
				item.addClass('is-drag-over');
			});

			item.addEventListener('dragleave', (e) => {
				if (!item.contains(e.relatedTarget as Node)) {
					item.removeClass('is-drag-over');
				}
			});

			item.addEventListener('drop', (e) => {
				e.preventDefault();
				const from = parseInt(e.dataTransfer!.getData('text/plain'));
				const to = parseInt(item.dataset.index!);
				if (from !== to) {
					const list = [...this.plugin.settings.checkboxes];
					const [moved] = list.splice(from, 1);
					list.splice(to, 0, moved);
					this.plugin.settings.checkboxes = list;
					void (async () => {
						await this.plugin.saveSettings();
						this.render();
						new Notice(`Moved "${moved.name}" to position ${to + 1}`);
					})();
				}
				item.removeClass('is-drag-over');
			});

			const preview = item.createDiv('checkbox-manager-preview');

			const symbolEl = preview.createSpan('checkbox-manager-symbol');
			symbolEl.textContent = `[${checkbox.symbol}]`;
			symbolEl.setCssProps({ '--checkbox-color': checkbox.color });

			const iconEl = preview.createSpan('checkbox-manager-icon');
			const previewStyle = this.plugin.settings.iconStyle || 'stroke';
			if (previewStyle === 'filled' && checkbox.icon) {
				iconEl.appendChild(sanitizeHTMLToDom(`<svg width="16" height="16" viewBox="${checkbox.viewBox || '0 0 512 512'}" fill="${checkbox.color}"><path d="${checkbox.icon}"/></svg>`));
			} else if (checkbox.customIconData) {
				const svgEls = checkbox.customIconData.elements
					? checkbox.customIconData.elements.join('')
					: (checkbox.customIconData.paths || []).map((d) => `<path d="${d}"/>`).join('');
				if (svgEls) {
					iconEl.appendChild(sanitizeHTMLToDom(`<svg width="16" height="16" viewBox="${checkbox.customIconData.viewBox}" fill="none" stroke="${checkbox.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgEls}</svg>`));
				}
			} else if (checkbox.icon) {
				iconEl.appendChild(sanitizeHTMLToDom(`<svg width="16" height="16" viewBox="${checkbox.viewBox || '0 0 512 512'}" fill="${checkbox.color}"><path d="${checkbox.icon}"/></svg>`));
			}

			const nameEl = preview.createSpan('checkbox-manager-label');
			nameEl.textContent = checkbox.name;

			const buttons = item.createDiv('checkbox-manager-actions');

			const editBtn = buttons.createEl('button', { text: 'Edit', cls: 'checkbox-manager-edit-btn' });
			editBtn.onclick = () => this.showEditCheckboxModal(checkbox, index);

			const delBtn = buttons.createEl('button', { text: 'Delete', cls: 'checkbox-manager-delete-btn' });
			delBtn.onclick = async () => {
				if (confirm(`Delete checkbox "${checkbox.name}" [${checkbox.symbol}]?`)) {
					this.plugin.settings.checkboxes.splice(index, 1);
					await this.plugin.saveSettings();
					this.render();
					new Notice(`Deleted checkbox: ${checkbox.name}`);
				}
			};
		});

		new Setting(containerEl)
			.setName('Reset to defaults')
			.setDesc('Reset all checkbox configurations to default values')
			.addButton((button) =>
				button
					.setButtonText('Reset')
					.setDestructive()
					.onClick(async () => {
						this.plugin.settings.checkboxes = [...DEFAULT_CHECKBOXES];
						await this.plugin.saveSettings();
						this.render();
						new Notice('Checkbox configurations reset to defaults');
					})
			);

		new Setting(containerEl).setName('Backup & restore').setHeading();

		new Setting(containerEl)
			.setName('Export configuration')
			.setDesc('Download your current checkbox configuration as a backup file')
			.addButton((button) =>
				button
					.setButtonText('Export')
					.setCta()
					.onClick(() => this.exportConfiguration())
			);

		new Setting(containerEl)
			.setName('Import configuration')
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
		const link = createEl('a');
		link.href = URL.createObjectURL(blob);
		link.download = `checkbox-manager-${new Date().toISOString().split('T')[0]}.json`;
		link.click();
		new Notice('Configuration exported successfully!');
	}

	private importConfiguration() {
		const input = createEl('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			try {
				const imported = JSON.parse(await file.text()) as { settings?: { checkboxes?: CheckboxConfig[] }; timestamp?: string };
				if (!imported.settings?.checkboxes) {
					new Notice('Invalid configuration file format');
					return;
				}
				if (confirm(`Import ${imported.settings.checkboxes.length} checkbox configurations?\n\nThis will replace your current settings.\nExported on: ${imported.timestamp || 'Unknown date'}`)) {
					this.plugin.settings = { ...this.plugin.settings, ...imported.settings };
					await this.plugin.saveSettings();
					this.render();
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
				this.render();
				new Notice(`Added checkbox: [${result.symbol}] ${result.name}`);
			}
		}).open();
	}

	private showEditCheckboxModal(checkbox: CheckboxConfig, index: number) {
		new CheckboxConfigModal(this.app, this.plugin, checkbox, (result) => {
			if (result) {
				this.plugin.settings.checkboxes[index] = result;
				void (async () => {
					await this.plugin.saveSettings();
					this.render();
					new Notice(`Updated checkbox: [${result.symbol}] ${result.name}`);
				})();
			}
		}).open();
	}
}
