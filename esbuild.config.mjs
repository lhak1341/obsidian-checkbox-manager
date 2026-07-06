import esbuild from 'esbuild';
import process from 'process';
import { copyFile } from 'fs/promises';

import { external, outdir } from './build.config.mjs';

const prod = process.argv[2] === 'production';

const context = await esbuild.context({
	entryPoints: ['src/main.ts'],
	bundle: true,
	format: 'cjs',
	target: 'es2020',
	logLevel: 'info',
	sourcemap: prod ? false : 'inline',
	treeShaking: true,
	external,
	outdir,
});

await context.rebuild();

await copyFile('styles.css', `${outdir}/styles.css`);
await copyFile('manifest.json', `${outdir}/manifest.json`);

if (prod) {
	process.exit(0);
} else {
	await context.watch();
}
