import { App, Modal, Notice, Setting, sanitizeHTMLToDom } from 'obsidian';
import type { CheckboxConfig } from './types';
import type CheckboxManagerPlugin from './main';
import { attachIconInput } from './icon-input';
import { renderIconInto } from './icon-render';

export class CheckboxConfigModal extends Modal {
	private plugin: CheckboxManagerPlugin;
	private config: CheckboxConfig | null;
	private onSubmit: (result: CheckboxConfig | null) => void;

	constructor(
		app: App,
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

		this.modalEl.addClass('checkbox-config-modal');

		new Setting(contentEl)
			.setName(this.config ? 'Edit checkbox' : 'Add new checkbox')
			.setHeading();

		const form = contentEl.createDiv();

		let symbol = this.config?.symbol || '';
		let name = this.config?.name || '';
		let color = this.config?.color || 'var(--color-orange)';

		new Setting(form)
			.setName('Symbol')
			.setDesc('Single character used in [X]')
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

		const iconSection = form.createDiv('checkbox-config-icon-section');

		if (isFilled) {
			new Setting(iconSection).setName('Icon (fontawesome/filled)').setHeading();
			const helper = iconSection.createDiv('checkbox-config-helper');
			helper.appendChild(sanitizeHTMLToDom(`Go to <a href="https://fontawesome.com/icons" target="_blank">fontawesome.com</a>, find an icon, click <strong>SVG</strong> → copy and paste the full SVG below`));
		} else {
			new Setting(iconSection).setName('Icon (lucide/stroke)').setHeading();
			const helper = iconSection.createDiv('checkbox-config-helper');
			helper.appendChild(sanitizeHTMLToDom(`Go to <a href="https://lucide.dev/icons" target="_blank">lucide.dev</a>, search for an icon, copy the SVG, and paste it below — or pick one by name:`));
		}

		const iconInput = attachIconInput(iconSection, {
			app: this.app,
			style: isFilled ? 'filled' : 'stroke',
			initial: { icon: this.config?.icon, viewBox: this.config?.viewBox, customIconData: this.config?.customIconData ?? null },
			onChange: () => updatePreview(),
		});

		const previewSection = form.createDiv('checkbox-config-preview-section');
		new Setting(previewSection).setName('Preview').setHeading();
		const previewContent = previewSection.createDiv();

		let saveButton: HTMLButtonElement;

		const updatePreview = () => {
			const value = iconInput.getValue();
			const hasIcon = 'icon' in value ? !!value.icon : !!(value.customIconData?.paths || value.customIconData?.elements);
			previewContent.empty();
			if (symbol && name && hasIcon) {
				const previewRow = previewContent.createDiv('checkbox-config-preview-content');
				const symEl = previewRow.createSpan('checkbox-config-preview-symbol');
				symEl.textContent = `[${symbol}]`;
				renderIconInto(
					previewRow,
					'icon' in value ? { icon: value.icon, viewBox: value.viewBox, color } : { customIconData: value.customIconData, color },
					isFilled ? 'filled' : 'stroke'
				);
				const nameDiv = previewRow.createDiv('checkbox-config-preview-name');
				nameDiv.textContent = name;
				previewSection.addClass('is-valid');
				saveButton.disabled = false;
			} else {
				const missing: string[] = [];
				if (!symbol) missing.push('symbol');
				if (!name) missing.push('name');
				if (!hasIcon) missing.push('icon');
				const placeholder = previewContent.createDiv('checkbox-config-preview-placeholder');
				placeholder.textContent = missing.length ? `Missing: ${missing.join(', ')}` : 'Fill in the fields above';
				previewSection.removeClass('is-valid');
				saveButton.disabled = true;
			}
		};

		const buttonContainer = form.createDiv('checkbox-config-buttons');

		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel', cls: 'checkbox-config-cancel-btn' });
		cancelButton.onclick = () => { this.onSubmit(null); this.close(); };

		saveButton = buttonContainer.createEl('button', { text: 'Save', cls: 'checkbox-config-save-btn' });
		saveButton.disabled = true;
		saveButton.onclick = () => {
			if (!symbol || !name) {
				new Notice('Symbol and name are required');
				return;
			}
			const result: CheckboxConfig = {
				symbol: symbol.trim(),
				name: name.trim(),
				color: color.trim(),
				description: this.config?.description || '',
				icon: this.config?.icon || '',
				viewBox: this.config?.viewBox || '0 0 512 512',
				customIconData: this.config?.customIconData,
			};
			const value = iconInput.getValue();
			if ('icon' in value) {
				result.icon = value.icon.trim();
				result.viewBox = value.viewBox.trim() || '0 0 512 512';
			} else {
				result.customIconData = value.customIconData ?? undefined;
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
