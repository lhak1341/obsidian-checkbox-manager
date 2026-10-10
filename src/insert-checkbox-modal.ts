import { App, Editor, FuzzySuggestModal } from 'obsidian';
import type CheckboxManagerPlugin from './main';
import type { CheckboxConfig } from './types';
import { iconsFor } from './icon';
import { renderIconInto } from './icon-render';
import { setCheckbox } from './checkbox-line';

export class InsertCheckboxModal extends FuzzySuggestModal<CheckboxConfig> {
	private plugin: CheckboxManagerPlugin;
	private editor: Editor;

	constructor(app: App, plugin: CheckboxManagerPlugin, editor: Editor) {
		super(app);
		this.plugin = plugin;
		this.editor = editor;
		this.setPlaceholder('Select a checkbox type…');
	}

	getItems(): CheckboxConfig[] {
		return this.plugin.settings.checkboxes;
	}

	getItemText(checkbox: CheckboxConfig): string {
		return `${checkbox.symbol} ${checkbox.name} ${checkbox.description}`;
	}

	renderSuggestion(match: { item: CheckboxConfig }, el: HTMLElement): void {
		const checkbox = match.item;
		el.addClass('insert-checkbox-suggestion');
		el.createSpan({ text: `[${checkbox.symbol}]`, cls: 'insert-checkbox-symbol' }).setCssProps({
			'--checkbox-color': checkbox.color,
		});
		const iconEl = el.createSpan('insert-checkbox-icon');
		renderIconInto(iconEl, iconsFor(this.plugin.settings.iconStyle), checkbox);
		el.createSpan({ text: checkbox.name, cls: 'insert-checkbox-name' });
	}

	onChooseItem(checkbox: CheckboxConfig): void {
		const cursor = this.editor.getCursor();
		const line = this.editor.getLine(cursor.line);
		const newLine = setCheckbox(line, checkbox.symbol);
		this.editor.setLine(cursor.line, newLine);
		this.editor.setCursor(cursor.line, newLine.length);
	}
}
