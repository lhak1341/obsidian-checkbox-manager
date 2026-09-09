import { AbstractInputSuggest, App } from 'obsidian';
import { allLucideIconNames, getLucideIconTags, setResolvedIcon } from './lucide-icons';
import { rankIconSuggestions } from './icon-search';

/** Autocomplete for icon ids registered with Obsidian (mostly Lucide), backed by allLucideIconNames() so gap-filled icons (e.g. "mosque") show up alongside natively-bundled ones. */
export class IconSuggest extends AbstractInputSuggest<string> {
	constructor(app: App, private inputEl: HTMLInputElement) {
		super(app, inputEl);
	}

	protected getSuggestions(query: string): string[] {
		return rankIconSuggestions(query, allLucideIconNames(), getLucideIconTags);
	}

	renderSuggestion(iconId: string, el: HTMLElement): void {
		el.addClass('checkbox-config-icon-suggest-item');
		setResolvedIcon(el.createSpan({ cls: 'checkbox-config-icon-suggest-icon' }), iconId);
		el.createSpan({ text: iconId });
	}

	selectSuggestion(iconId: string): void {
		this.setValue(iconId);
		this.inputEl.trigger('input');
		this.close();
	}
}
