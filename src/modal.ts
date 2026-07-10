import { App, getIcon, Modal, Notice, Setting, sanitizeHTMLToDom } from 'obsidian';
import type { CheckboxConfig, CustomIconData } from './types';
import type CheckboxManagerPlugin from './main';
import { iconDataFromElement, parseIconMarkup, renderIcon } from './icon';
import { IconSuggest } from './icon-suggest';

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
		let icon = this.config?.icon || '';
		let viewBox = this.config?.viewBox || '0 0 512 512';
		let customIconData: CustomIconData | null = this.config?.customIconData ?? null;

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
		let extractedInfo: HTMLDivElement;

		if (isFilled) {
			new Setting(iconSection).setName('Icon (fontawesome/filled)').setHeading();
			const helper = iconSection.createDiv('checkbox-config-helper');
			helper.appendChild(sanitizeHTMLToDom(`Go to <a href="https://fontawesome.com/icons" target="_blank">fontawesome.com</a>, find an icon, click <strong>SVG</strong> → copy and paste the full SVG below`));

			const svgAreaFilled = iconSection.createEl('textarea', { cls: 'checkbox-config-svg-input' });
			svgAreaFilled.placeholder = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n  <path d="M256 32c14.2 0..."/>\n</svg>';

			if (icon) {
				svgAreaFilled.value = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">\n  <path d="${icon}"/>\n</svg>`;
			}

			extractedInfo = iconSection.createDiv('checkbox-config-extracted-info');

			svgAreaFilled.oninput = () => {
				const val = svgAreaFilled.value.trim();
				if (!val) {
					icon = '';
					extractedInfo.textContent = '';
					svgAreaFilled.removeClass('is-valid', 'is-invalid');
					updatePreview();
					return;
				}
				const result = parseIconMarkup(val, 'filled');
				if (result.ok) {
					icon = result.icon ?? '';
					viewBox = result.viewBox;
					extractedInfo.textContent = `viewBox: ${result.viewBox}`;
					svgAreaFilled.removeClass('is-invalid');
					svgAreaFilled.addClass('is-valid');
				} else {
					icon = '';
					extractedInfo.textContent = result.reason;
					svgAreaFilled.removeClass('is-valid');
					svgAreaFilled.addClass('is-invalid');
				}
				updatePreview();
			};
		} else {
			new Setting(iconSection).setName('Icon (lucide/stroke)').setHeading();
			const helper = iconSection.createDiv('checkbox-config-helper');
			helper.appendChild(sanitizeHTMLToDom(`Go to <a href="https://lucide.dev/icons" target="_blank">lucide.dev</a>, search for an icon, copy the SVG, and paste it below — or pick one by name:`));

			const pickerInput = iconSection.createEl('input', {
				cls: 'checkbox-config-icon-suggest-input',
				attr: { type: 'text', placeholder: 'Search icon by name…' },
			});
			new IconSuggest(this.app, pickerInput);

			const svgArea = iconSection.createEl('textarea', { cls: 'checkbox-config-svg-input' });
			svgArea.placeholder = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ...>\n  <path d="..."/>\n</svg>';

			const syncSvgAreaFromCustomIconData = () => {
				if (customIconData?.paths) {
					const paths = customIconData.paths.map((d) => `<path d="${d}"/>`).join('\n  ');
					svgArea.value = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${customIconData.viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n  ${paths}\n</svg>`;
				} else if (customIconData?.elements) {
					svgArea.value = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${customIconData.viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n  ${customIconData.elements.join('\n  ')}\n</svg>`;
				}
			};
			syncSvgAreaFromCustomIconData();

			extractedInfo = iconSection.createDiv('checkbox-config-extracted-info');

			pickerInput.addEventListener('input', () => {
				const iconId = pickerInput.value.trim();
				if (!iconId) return;
				const svgEl = getIcon(iconId);
				if (!svgEl) return;
				customIconData = iconDataFromElement(svgEl);
				syncSvgAreaFromCustomIconData();
				extractedInfo.textContent = `viewBox: ${customIconData.viewBox}`;
				svgArea.removeClass('is-invalid');
				svgArea.addClass('is-valid');
				updatePreview();
			});

			svgArea.oninput = () => {
				const val = svgArea.value.trim();
				if (!val) {
					customIconData = null;
					extractedInfo.textContent = '';
					svgArea.removeClass('is-valid', 'is-invalid');
					updatePreview();
					return;
				}
				const result = parseIconMarkup(val, 'stroke');
				if (result.ok) {
					customIconData = result.customIconData ?? null;
					extractedInfo.textContent = `viewBox: ${result.viewBox}`;
					svgArea.removeClass('is-invalid');
					svgArea.addClass('is-valid');
				} else {
					customIconData = null;
					extractedInfo.textContent = result.reason;
					svgArea.removeClass('is-valid');
					svgArea.addClass('is-invalid');
				}
				updatePreview();
			};
		}

		const previewSection = form.createDiv('checkbox-config-preview-section');
		new Setting(previewSection).setName('Preview').setHeading();
		const previewContent = previewSection.createDiv();

		let saveButton: HTMLButtonElement;

		const updatePreview = () => {
			const hasIcon = isFilled ? !!icon : !!(customIconData?.paths || customIconData?.elements);
			previewContent.empty();
			if (symbol && name && hasIcon) {
				const previewRow = previewContent.createDiv('checkbox-config-preview-content');
				const symEl = previewRow.createSpan('checkbox-config-preview-symbol');
				symEl.textContent = `[${symbol}]`;
				const previewMarkup = renderIcon({ icon, viewBox, customIconData, color }, isFilled ? 'filled' : 'stroke');
				if (previewMarkup) previewRow.appendChild(sanitizeHTMLToDom(previewMarkup));
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
