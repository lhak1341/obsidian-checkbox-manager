// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { getIcon, type App } from 'obsidian';
import { attachIconInput } from './icon-input';

// Obsidian extends HTMLElement.prototype with these at runtime; jsdom doesn't have them.
type ElOpts = { cls?: string | string[]; text?: string; attr?: Record<string, string> };

function createEl(this: HTMLElement, tag: string, opts?: ElOpts) {
	const el = document.createElement(tag);
	if (opts?.cls) el.className = Array.isArray(opts.cls) ? opts.cls.join(' ') : opts.cls;
	if (opts?.text) el.textContent = opts.text;
	if (opts?.attr) for (const [k, v] of Object.entries(opts.attr)) el.setAttribute(k, v);
	this.appendChild(el);
	return el;
}

function polyfillObsidianDom() {
	const proto = HTMLElement.prototype as unknown as {
		createEl?: typeof createEl;
		createDiv?: (this: HTMLElement, opts?: ElOpts | string) => HTMLElement;
		empty?: (this: HTMLElement) => void;
		addClass?: (this: HTMLElement, ...classes: string[]) => void;
		removeClass?: (this: HTMLElement, ...classes: string[]) => void;
	};
	if (proto.createEl) return;
	proto.createEl = createEl;
	proto.createDiv = function (this: HTMLElement, opts?: ElOpts | string) {
		return createEl.call(this, 'div', typeof opts === 'string' ? { cls: opts } : opts);
	};
	proto.empty = function (this: HTMLElement) {
		while (this.firstChild) this.removeChild(this.firstChild);
	};
	proto.addClass = function (this: HTMLElement, ...classes: string[]) {
		this.classList.add(...classes);
	};
	proto.removeClass = function (this: HTMLElement, ...classes: string[]) {
		this.classList.remove(...classes);
	};
}
polyfillObsidianDom();

function parseSvgElement(markup: string): SVGSVGElement {
	const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
	return doc.querySelector('svg') as SVGSVGElement;
}

function dispatchInput(el: HTMLElement) {
	el.dispatchEvent(new Event('input'));
}

const FILLED_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M1 1"/></svg>';
const STROKE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2"/><circle cx="1" cy="1" r="1"/></svg>';

describe('attachIconInput — filled style', () => {
	it('starts empty and does not fire onChange during setup', () => {
		const container = document.createElement('div');
		const onChange = vi.fn();
		const handle = attachIconInput(container, { app: {} as App, style: 'filled', initial: {}, onChange });

		expect(handle.getValue()).toEqual({ icon: '', viewBox: '0 0 512 512' });
		expect(onChange).not.toHaveBeenCalled();
	});

	it('parses a pasted SVG into icon/viewBox and marks the textarea valid', () => {
		const container = document.createElement('div');
		const onChange = vi.fn();
		const handle = attachIconInput(container, { app: {} as App, style: 'filled', initial: {}, onChange });
		const textarea = container.querySelector('textarea')!;

		textarea.value = FILLED_SVG;
		dispatchInput(textarea);

		expect(handle.getValue()).toEqual({ icon: 'M1 1', viewBox: '0 0 640 640' });
		expect(textarea.classList.contains('is-valid')).toBe(true);
		expect(container.querySelector('.checkbox-config-extracted-info')!.textContent).toBe('viewBox: 0 0 640 640');
		expect(onChange).toHaveBeenCalledTimes(1);
	});

	it('rejects invalid markup, resets the value, and marks the textarea invalid', () => {
		const container = document.createElement('div');
		const handle = attachIconInput(container, { app: {} as App, style: 'filled', initial: { icon: 'M1 1', viewBox: '0 0 512 512' }, onChange: vi.fn() });
		const textarea = container.querySelector('textarea')!;

		textarea.value = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
		dispatchInput(textarea);

		expect(handle.getValue()).toEqual({ icon: '', viewBox: '0 0 512 512' });
		expect(textarea.classList.contains('is-invalid')).toBe(true);
		expect(container.querySelector('.checkbox-config-extracted-info')!.textContent).toBe('No path elements');
	});

	it('clearing the textarea resets to empty with no validity class', () => {
		const container = document.createElement('div');
		const handle = attachIconInput(container, { app: {} as App, style: 'filled', initial: { icon: 'M1 1', viewBox: '0 0 512 512' }, onChange: vi.fn() });
		const textarea = container.querySelector('textarea')!;

		textarea.value = '';
		dispatchInput(textarea);

		expect(handle.getValue()).toEqual({ icon: '', viewBox: '0 0 512 512' });
		expect(textarea.classList.contains('is-valid')).toBe(false);
		expect(textarea.classList.contains('is-invalid')).toBe(false);
	});

	it('seeds the textarea from an initial value, pretty-printed', () => {
		const container = document.createElement('div');
		attachIconInput(container, { app: {} as App, style: 'filled', initial: { icon: 'M1 1', viewBox: '0 0 512 512' }, onChange: vi.fn() });
		const textarea = container.querySelector('textarea')!;

		expect(textarea.value).toBe('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n  <path d="M1 1"/>\n</svg>');
	});
});

describe('attachIconInput — stroke style', () => {
	it('starts with no customIconData when initial is empty', () => {
		const container = document.createElement('div');
		const handle = attachIconInput(container, { app: {} as App, style: 'stroke', initial: {}, onChange: vi.fn() });

		expect(handle.getValue()).toEqual({ customIconData: null });
	});

	it('parses a pasted SVG into customIconData', () => {
		const container = document.createElement('div');
		const onChange = vi.fn();
		const handle = attachIconInput(container, { app: {} as App, style: 'stroke', initial: {}, onChange });
		const textarea = container.querySelector('textarea')!;

		textarea.value = STROKE_SVG;
		dispatchInput(textarea);

		const value = handle.getValue();
		expect('customIconData' in value && value.customIconData?.viewBox).toBe('0 0 24 24');
		expect('customIconData' in value && value.customIconData?.elements).toHaveLength(2);
		expect(textarea.classList.contains('is-valid')).toBe(true);
		expect(onChange).toHaveBeenCalledTimes(1);
	});

	it('picker selection resolves via getIcon(), syncs the textarea, and does not reparse', () => {
		const container = document.createElement('div');
		const onChange = vi.fn();
		vi.mocked(getIcon).mockReturnValue(parseSvgElement(STROKE_SVG));

		const handle = attachIconInput(container, { app: {} as App, style: 'stroke', initial: {}, onChange });
		const picker = container.querySelector('.checkbox-config-icon-suggest-input') as HTMLInputElement;

		picker.value = 'circle';
		dispatchInput(picker);

		const value = handle.getValue();
		expect('customIconData' in value && value.customIconData?.viewBox).toBe('0 0 24 24');
		const textarea = container.querySelector('textarea')!;
		expect(textarea.value).toContain('stroke="currentColor"');
		expect(container.querySelector('.checkbox-config-extracted-info')!.textContent).toBe('viewBox: 0 0 24 24');
		expect(onChange).toHaveBeenCalledTimes(1);
	});
});
