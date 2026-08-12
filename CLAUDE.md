# obsidian-checkbox-manager

House conventions for Obsidian plugin repos live in the `obsidian-plugin-dev` skill —
bun, script contract, ESLint/obsidianmd setup, settings-tab structure, API/CSS gotchas,
live debugging. Only repo-specific facts are below.

## Architecture

Dynamic CSS generation via an injected `<style>` element is this plugin's core mechanism —
it builds per-checkbox rules from user settings (colors, SVG masks) that cannot be
expressed as static CSS. `obsidianmd/no-forbidden-elements` is intentionally off for this
reason.

`icon.ts`'s mask-image SVGs must declare `xmlns="http://www.w3.org/2000/svg"` and use
resolvable colors only (`currentColor`, never a CSS custom property). Getting either wrong
renders checkboxes blank with no console error, and `getComputedStyle` still reports the
mask-image property as if correct.

If generated CSS/SVG output looks right but does not render, diff it byte-for-byte against
`git show HEAD:src/<file>` for identical input before guessing further — a missing `xmlns`
is invisible to lint, build, and `getComputedStyle`.

## Conventions

- New domain concepts (e.g. "Icon") belong in `CONTEXT.md` — check and update it before
  introducing new terminology.
- Source files use **tabs**. If `Edit`'s `old_string` fails on whitespace, verify the exact
  bytes with `sed -n '<range>p' file | od -c` rather than retyping indentation by eye.
- Build output goes to `dist/`; `scripts/deploy.mjs` copies from there and migrates
  `data.json` from the older `lhak-checkboxes` folder on first deploy.

## Live testing

`bun run build:plugin && bun run scripts/deploy.mjs`, then
`obsidian plugin:reload id=obsidian-checkbox-manager`.
