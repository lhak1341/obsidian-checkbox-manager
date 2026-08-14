import { defineConfig } from 'vitest/config';
import path from 'node:path';

// The real 'obsidian' package ships types only (package.json "main": "") — nothing Vite can
// resolve at runtime. Alias it to __mocks__/obsidian.ts for tests; the actual plugin build
// (esbuild.config.mjs) marks 'obsidian' external instead and is untouched by this file.
export default defineConfig({
	resolve: {
		alias: {
			obsidian: path.resolve(__dirname, '__mocks__/obsidian.ts'),
		},
	},
});
