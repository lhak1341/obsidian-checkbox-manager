import { describe, expect, it } from 'vitest';
import { setCheckbox } from './checkbox-line';

describe('setCheckbox', () => {
	it.each([
		['', '- [x] '],
		['foo', '- [x] foo'],
		['   ', '   - [x] '],
		['  foo', '  - [x] foo'],
		['\tfoo', '\t- [x] foo'],
	])('plain line %j -> %j', (line, expected) => {
		expect(setCheckbox(line, 'x')).toBe(expected);
	});

	it.each([
		['- foo', '- [x] foo'],
		['* foo', '* [x] foo'],
		['+ foo', '+ [x] foo'],
		['1. foo', '1. [x] foo'],
		['12) foo', '12) [x] foo'],
		['  - foo', '  - [x] foo'],
		['-', '- [x] '],
	])('keeps the list marker: %j -> %j', (line, expected) => {
		expect(setCheckbox(line, 'x')).toBe(expected);
	});

	it.each([
		['- [ ] foo', '- [x] foo'],
		['- [x] foo', '- [x] foo'],
		['- [!] foo', '- [x] foo'],
		['- [ ]', '- [x] '],
		['- [ ] ', '- [x] '],
		['1. [ ] foo', '1. [x] foo'],
		['  * [?] foo', '  * [x] foo'],
	])('replaces the symbol of an existing task: %j -> %j', (line, expected) => {
		expect(setCheckbox(line, 'x')).toBe(expected);
	});

	it.each([
		['- [xx] foo', '- [x] [xx] foo'],
		['[a] note', '- [x] [a] note'],
		['- [ ]foo', '- [x] [ ]foo'],
		['[[wikilink]] x', '- [x] [[wikilink]] x'],
	])('does not treat %j as a task box', (line, expected) => {
		expect(setCheckbox(line, 'x')).toBe(expected);
	});

	it.each([
		['**bold** text', '- [x] **bold** text'],
		['*italic* text', '- [x] *italic* text'],
		['-5 degrees', '- [x] -5 degrees'],
		['+1 great', '- [x] +1 great'],
		['3.14 is pi', '- [x] 3.14 is pi'],
		['---', '- [x] ---'],
		['# Title', '- [x] # Title'],
	])('does not treat %j as a list marker', (line, expected) => {
		expect(setCheckbox(line, 'x')).toBe(expected);
	});

	it.each([
		['> foo', '> - [x] foo'],
		['> - foo', '> - [x] foo'],
		['> > - [ ] foo', '> > - [x] foo'],
		['  > foo', '  > - [x] foo'],
		['>foo', '>- [x] foo'],
	])('keeps the blockquote prefix: %j -> %j', (line, expected) => {
		expect(setCheckbox(line, 'x')).toBe(expected);
	});

	it.each(['.', '$', '\\', '$&', ']'])('writes the symbol %j literally', (symbol) => {
		expect(setCheckbox('foo', symbol)).toBe(`- [${symbol}] foo`);
		expect(setCheckbox('- [ ] foo', symbol)).toBe(`- [${symbol}] foo`);
	});
});
