import { AbstractInputSuggest, App, setIcon } from 'obsidian';
import { allLucideIconNames, getLucideIconTags, resolveLucideIconId } from './lucide-icons';
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
		setIcon(el.createSpan({ cls: 'checkbox-config-icon-suggest-icon' }), resolveLucideIconId(iconId));
		el.createSpan({ text: iconId });
	}

	selectSuggestion(iconId: string): void {
		this.setValue(iconId);
		this.inputEl.trigger('input');
		this.close();
	}
}
