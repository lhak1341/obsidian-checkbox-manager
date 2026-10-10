import { App, Modal, Setting, sanitizeHTMLToDom } from 'obsidian';
import type { CheckboxConfig } from './types';
import type CheckboxManagerPlugin from './main';
import { attachIconInput } from './icon-input';
import { iconsFor } from './icon';
import { renderIconInto } from './icon-render';
import { COLOR_OPTIONS, evaluateForm } from './checkbox-config-form';

export class CheckboxConfigModal extends Modal {
	private plugin: CheckboxManagerPlugin;
	private config: CheckboxConfig | null;
	private onSubmit: (result: CheckboxConfig) => void;

	constructor(
		app: App,
		plugin: CheckboxManagerPlugin,
		config: CheckboxConfig | null,
		onSubmit: (result: CheckboxConfig) => void
	) {
		super(app);
		this.plugin = plugin;
		this.config = config;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		const icons = iconsFor(this.plugin.settings.iconStyle);

		this.modalEl.addClass('checkbox-config-modal');

		new Setting(contentEl)
			.setName(this.config ? 'Edit checkbox' : 'Add new checkbox')
			.setHeading();

		const form = contentEl.createDiv();

		let symbol = this.config?.symbol || '';
		let name = this.config?.name || '';
		let color = this.config?.color || COLOR_OPTIONS[0].value;

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
				for (const option of COLOR_OPTIONS) dropdown.addOption(option.value, option.label);
				dropdown.setValue(color);
				dropdown.onChange((v) => {
					color = v;
					updatePreview();
				});
			});

		const iconSection = form.createDiv('checkbox-config-icon-section');

		new Setting(iconSection).setName(icons.heading).setHeading();
		const helper = iconSection.createDiv('checkbox-config-helper');
		helper.appendChild(sanitizeHTMLToDom(icons.helperHtml));

		const iconInput = attachIconInput(iconSection, {
			app: this.app,
			icons,
			initial: this.config ?? {},
			onChange: () => updatePreview(),
		});

		const previewSection = form.createDiv('checkbox-config-preview-section');
		new Setting(previewSection).setName('Preview').setHeading();
		const previewContent = previewSection.createDiv();

		let saveButton: HTMLButtonElement;
		let saveable: CheckboxConfig | null = null;

		const updatePreview = () => {
			const result = evaluateForm({
				existing: this.config,
				form: { symbol, name, color },
				iconFields: iconInput.getValue(),
				icons,
				checkboxes: this.plugin.settings.checkboxes,
			});
			previewContent.empty();
			if (result.ok) {
				const { config } = result;
				const previewRow = previewContent.createDiv('checkbox-config-preview-content');
				const symEl = previewRow.createSpan('checkbox-config-preview-symbol');
				symEl.textContent = `[${config.symbol}]`;
				renderIconInto(previewRow, icons, { ...iconInput.getValue(), color: config.color });
				const nameDiv = previewRow.createDiv('checkbox-config-preview-name');
				nameDiv.textContent = config.name;
				previewSection.addClass('is-valid');
			} else {
				const placeholder = previewContent.createDiv('checkbox-config-preview-placeholder');
				placeholder.textContent = result.message;
				previewSection.removeClass('is-valid');
			}
			saveable = result.ok ? result.config : null;
			saveButton.disabled = !saveable;
		};

		const buttonContainer = form.createDiv('checkbox-config-buttons');

		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel', cls: 'checkbox-config-cancel-btn' });
		cancelButton.onclick = () => this.close();

		saveButton = buttonContainer.createEl('button', { text: 'Save', cls: 'checkbox-config-save-btn' });
		saveButton.disabled = true;
		saveButton.onclick = () => {
			if (!saveable) return;
			this.onSubmit(saveable);
			this.close();
		};

		updatePreview();
	}

	onClose() {
		this.contentEl.empty();
	}
}
