import { access, copyFile, mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const VAULT_DIR =
	process.env.OBSIDIAN_VAULT_DIR ??
	'/Users/lhak/Library/Mobile Documents/iCloud~md~obsidian/Documents/lhakZettel/.obsidian/plugins';

const VAULT_PLUGIN_DIR = join(VAULT_DIR, 'obsidian-checkbox-manager');
const OLD_PLUGIN_DIR = join(VAULT_DIR, 'lhak-checkboxes');

const FILES = ['manifest.json', join('dist', 'main.js'), join('dist', 'styles.css')];

await mkdir(VAULT_PLUGIN_DIR, { recursive: true });

for (const src of FILES) {
	const dest = join(VAULT_PLUGIN_DIR, src.split('/').at(-1));
	await copyFile(src, dest);
	console.log(`Copied ${src} → ${dest}`);
}

// Migrate settings from old plugin if new plugin has no data yet
const newDataPath = join(VAULT_PLUGIN_DIR, 'data.json');
const oldDataPath = join(OLD_PLUGIN_DIR, 'data.json');

const newDataExists = await access(newDataPath).then(() => true).catch(() => false);

if (!newDataExists) {
	const oldDataExists = await access(oldDataPath).then(() => true).catch(() => false);
	if (oldDataExists) {
		await copyFile(oldDataPath, newDataPath);
		const data = JSON.parse(await readFile(newDataPath, 'utf8'));
		console.log(`Migrated ${data.checkboxes?.length ?? 0} checkboxes from lhak-checkboxes.`);
	}
} else {
	const data = JSON.parse(await readFile(newDataPath, 'utf8'));
	console.log(`Keeping existing data.json (${data.checkboxes?.length ?? 0} checkboxes).`);
}

console.log('Deploy complete.');
