// Copies build output into the vault's plugin folder.
// Override the plugins directory with OBSIDIAN_VAULT_DIR.
import { access, copyFile, mkdir, readFile } from 'fs/promises';
import { basename, join } from 'path';

const VAULT_DIR =
	process.env.OBSIDIAN_VAULT_DIR ??
	'/Users/lhak/Library/Mobile Documents/iCloud~md~obsidian/Documents/lhakZettel/.obsidian/plugins';

const PLUGIN_DIR_NAME = 'obsidian-checkbox-manager';
// This plugin was once deployed under a different folder; settings are migrated once.
const OLD_PLUGIN_DIR_NAME = 'lhak-checkboxes';

const REQUIRED = ['manifest.json', join('dist', 'main.js')];
const OPTIONAL = [join('dist', 'styles.css')];

const targets = [join(VAULT_DIR, PLUGIN_DIR_NAME)];

const exists = (path) => access(path).then(() => true, () => false);

for (const src of REQUIRED) {
	if (!(await exists(src))) {
		throw new Error(`Missing build output: ${src} — run "bun run build:plugin" first.`);
	}
}

for (const target of targets) {
	await mkdir(target, { recursive: true });
	for (const src of [...REQUIRED, ...OPTIONAL]) {
		if (!(await exists(src))) continue;
		await copyFile(src, join(target, basename(src)));
	}
	console.log(`Deployed to ${target}`);
}

// Carry settings over from the old folder, but only when this one has none yet.
const newDataPath = join(VAULT_DIR, PLUGIN_DIR_NAME, 'data.json');
const oldDataPath = join(VAULT_DIR, OLD_PLUGIN_DIR_NAME, 'data.json');

if (await exists(newDataPath)) {
	const data = JSON.parse(await readFile(newDataPath, 'utf8'));
	console.log(`Keeping existing data.json (${data.checkboxes?.length ?? 0} checkboxes).`);
} else if (await exists(oldDataPath)) {
	await copyFile(oldDataPath, newDataPath);
	const data = JSON.parse(await readFile(newDataPath, 'utf8'));
	console.log(`Migrated ${data.checkboxes?.length ?? 0} checkboxes from ${OLD_PLUGIN_DIR_NAME}.`);
}
