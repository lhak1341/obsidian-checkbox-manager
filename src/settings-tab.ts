import { App, ExtraButtonComponent, Notice, PluginSettingTab, Setting } from 'obsidian';
import type { CheckboxConfig } from './types';
import type { ListResult } from './checkbox-list';
import type CheckboxManagerPlugin from './main';
import { CheckboxConfigModal } from './modal';
import { iconsFor } from './icon';
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

		this.renderGeneralSettings(containerEl.createDiv('setting-group').createDiv('setting-items'));

		new Setting(containerEl).setName('Checkbox configurations').setHeading();
		this.renderChecklistSection(containerEl.createDiv('setting-group').createDiv('setting-items'));

		new Setting(containerEl).setName('Backup & restore').setHeading();
		this.renderBackupSection(containerEl.createDiv('setting-group').createDiv('setting-items'));

		containerEl.scrollTop = scrollTop;
	}

	/** Runs a plugin list operation, re-renders the list when it succeeded, and shows its Notice (success message or refusal reason). */
	private async applyCheckboxOp(run: () => Promise<ListResult>): Promise<void> {
		const result = await run();
		if (result.ok) this.render();
		new Notice(result.ok ? result.message : result.reason);
	}

	private renderGeneralSettings(container: HTMLElement): void {
		new Setting(container)
			.setName('Enable custom checkboxes')
			.setDesc('Toggle custom checkbox styling on/off')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enabled).onChange(async (value) => {
					this.plugin.settings.enabled = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(container)
			.setName('Icon style')
			.setDesc("Filled: bold fontawesome icons. Stroke: thin lucide icons that match Obsidian's UI.")
			.addDropdown((dropdown) => {
				dropdown.addOption('stroke', 'Stroke (lucide)');
				dropdown.addOption('filled', 'Filled (fontawesome)');
				dropdown.setValue(this.plugin.settings.iconStyle);
				dropdown.onChange(async (value) => {
					this.plugin.settings.iconStyle = value as 'stroke' | 'filled';
					await this.plugin.saveSettings();
					this.render();
					new Notice(`Icon style changed to ${value}`);
				});
			});

		new Setting(container)
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

		new Setting(container)
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
	}

	private renderChecklistSection(container: HTMLElement): void {
		new Setting(container)
			.setName('Add new checkbox')
			.setDesc('Add a new custom checkbox type')
			.addButton((button) =>
				button
					.setButtonText('Add checkbox')
					.setCta()
					.onClick(() => this.showAddCheckboxModal())
			);

		this.plugin.settings.checkboxes.forEach((checkbox, index) => {
			this.renderChecklistItem(container, checkbox, index);
		});

		new Setting(container)
			.setName('Reset to defaults')
			.setDesc('Reset all checkbox configurations to default values')
			.addButton((button) =>
				button
					.setButtonText('Reset')
					.setDestructive()
					.onClick(async () => {
						await this.plugin.resetCheckboxes();
						this.render();
						new Notice('Checkbox configurations reset to defaults');
					})
			);
	}

	private renderChecklistItem(container: HTMLElement, checkbox: CheckboxConfig, index: number): void {
		const item = container.createDiv('checkbox-manager-item');
		item.draggable = true;
		item.dataset.index = index.toString();

		item.addEventListener('dragstart', (e) => {
			item.addClass('is-dragging');
			e.dataTransfer!.effectAllowed = 'move';
			e.dataTransfer!.setData('text/plain', index.toString());
		});

		item.addEventListener('dragend', () => {
			item.removeClass('is-dragging');
			this.containerEl.querySelectorAll<HTMLElement>('.checkbox-manager-item').forEach((el) => {
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
			if (from !== to) void this.applyCheckboxOp(() => this.plugin.reorderCheckbox(from, to));
			item.removeClass('is-drag-over');
		});

		const preview = item.createDiv('checkbox-manager-preview');

		const symbolEl = preview.createSpan('checkbox-manager-symbol');
		symbolEl.textContent = `[${checkbox.symbol}]`;
		symbolEl.setCssProps({ '--checkbox-color': checkbox.color });

		const iconEl = preview.createSpan('checkbox-manager-icon');
		renderIconInto(iconEl, iconsFor(this.plugin.settings.iconStyle), checkbox);

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
					void this.applyCheckboxOp(() => this.plugin.removeCheckbox(checkbox.symbol));
				}
			});
	}

	private renderBackupSection(container: HTMLElement): void {
		new Setting(container)
			.setName('Export configuration')
			.setDesc('Download your current checkbox configuration as a backup file')
			.addButton((button) =>
				button
					.setButtonText('Export')
					.setCta()
					.onClick(() => this.exportConfiguration())
			);

		new Setting(container)
			.setName('Import configuration')
			.setDesc('Restore checkbox configuration from a backup file')
			.addButton((button) =>
				button.setButtonText('Import').onClick(() => this.importConfiguration())
			);
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
				await this.plugin.replaceSettings(result.settings);
				this.render();
				new Notice(`Successfully imported ${result.checkboxCount} checkbox configurations!`);
			}
		};
		input.click();
	}

	private showAddCheckboxModal() {
		new CheckboxConfigModal(this.app, this.plugin, null, (result) => {
			void this.applyCheckboxOp(() => this.plugin.addCheckbox(result));
		}).open();
	}

	private showEditCheckboxModal(checkbox: CheckboxConfig) {
		const originalSymbol = checkbox.symbol;
		new CheckboxConfigModal(this.app, this.plugin, checkbox, (result) => {
			void this.applyCheckboxOp(() => this.plugin.updateCheckbox(originalSymbol, result));
		}).open();
	}
}
