import { App, ExtraButtonComponent, Notice, PluginSettingTab, Setting } from 'obsidian';
import type { CheckboxConfig } from './types';
import type CheckboxManagerPlugin from './main';
import { CheckboxConfigModal } from './modal';
import { DEFAULT_CHECKBOXES } from './defaults';
import { renderIconInto } from './icon-render';
import { deserializeConfig, serializeConfig, suggestFilename } from './config-backup';

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
		const scrollTop = containerEl.scrollTop;
		containerEl.empty();

		const generalItems = containerEl.createDiv('setting-group').createDiv('setting-items');

		new Setting(generalItems)
			.setName('Enable custom checkboxes')
			.setDesc('Toggle custom checkbox styling on/off')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enabled).onChange(async (value) => {
					this.plugin.settings.enabled = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(generalItems)
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

		new Setting(generalItems)
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

		new Setting(generalItems)
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
		const checkboxItems = containerEl.createDiv('setting-group').createDiv('setting-items');

		new Setting(checkboxItems)
			.setName('Add new checkbox')
			.setDesc('Add a new custom checkbox type')
			.addButton((button) =>
				button
					.setButtonText('Add checkbox')
					.setCta()
					.onClick(() => this.showAddCheckboxModal())
			);

		this.plugin.settings.checkboxes.forEach((checkbox, index) => {
			const item = checkboxItems.createDiv('checkbox-manager-item');
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
			renderIconInto(iconEl, checkbox, this.plugin.settings.iconStyle || 'stroke');

			const nameEl = preview.createSpan('checkbox-manager-label');
			nameEl.textContent = checkbox.name;

			const buttons = item.createDiv('checkbox-manager-actions');

			new ExtraButtonComponent(buttons)
				.setIcon('pencil')
				.setTooltip('Edit')
				.onClick(() => this.showEditCheckboxModal(checkbox));

			new ExtraButtonComponent(buttons)
				.setIcon('trash-2')
				.setTooltip('Delete')
				.onClick(() => {
					if (confirm(`Delete checkbox "${checkbox.name}" [${checkbox.symbol}]?`)) {
						void (async () => {
							await this.plugin.removeCheckbox(checkbox.symbol);
							this.render();
							new Notice(`Deleted checkbox: ${checkbox.name}`);
						})();
					}
				});
		});

		new Setting(checkboxItems)
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
		const backupItems = containerEl.createDiv('setting-group').createDiv('setting-items');

		new Setting(backupItems)
			.setName('Export configuration')
			.setDesc('Download your current checkbox configuration as a backup file')
			.addButton((button) =>
				button
					.setButtonText('Export')
					.setCta()
					.onClick(() => this.exportConfiguration())
			);

		new Setting(backupItems)
			.setName('Import configuration')
			.setDesc('Restore checkbox configuration from a backup file')
			.addButton((button) =>
				button.setButtonText('Import').onClick(() => this.importConfiguration())
			);

		containerEl.scrollTop = scrollTop;
	}

	private exportConfiguration() {
		const now = new Date();
		const blob = new Blob([serializeConfig(this.plugin.settings, now)], { type: 'application/json' });
		const link = createEl('a');
		link.href = URL.createObjectURL(blob);
		link.download = suggestFilename(now);
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
			const result = deserializeConfig(await file.text(), this.plugin.settings);
			if (!result.ok) {
				new Notice(result.reason);
				return;
			}
			if (confirm(`Import ${result.checkboxCount} checkbox configurations?\n\nThis will replace your current settings.\nExported on: ${result.timestamp || 'Unknown date'}`)) {
				this.plugin.settings = result.settings;
				await this.plugin.saveSettings();
				this.render();
				new Notice(`Successfully imported ${result.checkboxCount} checkbox configurations!`);
			}
		};
		input.click();
	}

	private showAddCheckboxModal() {
		new CheckboxConfigModal(this.app, this.plugin, null, (result) => {
			if (result) {
				void (async () => {
					await this.plugin.addCheckbox(result);
					this.render();
					new Notice(`Added checkbox: [${result.symbol}] ${result.name}`);
				})();
			}
		}).open();
	}

	private showEditCheckboxModal(checkbox: CheckboxConfig) {
		const originalSymbol = checkbox.symbol;
		new CheckboxConfigModal(this.app, this.plugin, checkbox, (result) => {
			if (result) {
				void (async () => {
					await this.plugin.updateCheckbox(originalSymbol, result);
					this.render();
					new Notice(`Updated checkbox: [${result.symbol}] ${result.name}`);
				})();
			}
		}).open();
	}
}
