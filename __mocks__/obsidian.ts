import { vi } from 'vitest';

// The real 'obsidian' package ships types only (package.json "main": "") — nothing to import at
// test runtime. This stands in for it wherever a test transitively imports a module that imports
// 'obsidian' (see src/icon-input.test.ts). Extend as new runtime-imported obsidian exports show up.
export class App {}

export class AbstractInputSuggest<T> {
	constructor(_app: App, _inputEl: HTMLInputElement) {}
}

export const getIcon = vi.fn();
export const setIcon = vi.fn();
export const addIcon = vi.fn();
export const getIconIds = vi.fn(() => [] as string[]);
export const sanitizeHTMLToDom = vi.fn((html: string) => {
	const template = document.createElement('template');
	template.innerHTML = html;
	return template.content;
});
