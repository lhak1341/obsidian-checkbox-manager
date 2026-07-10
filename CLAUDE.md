## Architecture

Dynamic CSS generation via an injected `<style>` element is this plugin's core mechanism — it builds per-checkbox CSS rules from user settings (colors, SVG masks) that cannot be expressed as static CSS. The `obsidianmd/no-forbidden-elements` rule is intentionally off for this reason.

`icon.ts`'s mask-image SVGs must declare `xmlns="http://www.w3.org/2000/svg"` and use resolvable colors only (`currentColor`, never a CSS custom property) — a `data:image/svg+xml` URI used as `-webkit-mask-image` is parsed as a standalone document, unlike an inline DOM `<svg>`, so it can't infer the namespace and can't resolve `var(--...)` from the host document. Getting either wrong renders checkboxes blank with no console error, and `getComputedStyle` still reports the mask-image property as if it were correct.

If generated CSS/SVG output looks right but doesn't render, diff it byte-for-byte against `git show HEAD:src/<file>` for identical input before guessing further — formatting differences like a missing `xmlns` are invisible to lint, build, and `getComputedStyle`.

## Settings UI
Obsidian's `.setting-items` class only gets padding/background when nested inside `.setting-group` — wrap grouped settings in `containerEl.createDiv('setting-group').createDiv('setting-items')` and pass the inner div to `new Setting(...)`, not `containerEl` directly.

## Domain glossary
New domain concepts (e.g. "Icon") belong in `CONTEXT.md` — check/update it before introducing new terminology.

## Async callbacks
When async code is needed inside a `void`-typed callback (modal `onSubmit`, DOM event handlers), use `void (async () => { await …; })()` — assigning an `async` function directly fires `@typescript-eslint/no-misused-promises`.

## Lint
`npm run lint` always reports warnings in `deploy.mjs` and `esbuild.config.mjs` (intentional Node.js usage). Run `npx eslint src/` to get the meaningful signal for plugin code.

## Editing
Source files use tabs for indentation. If `Edit`'s `old_string` fails to match on whitespace, don't retype indentation by eye from `Read` output — verify exact bytes with `sed -n '<range>p' file | od -c` first.

## Testing UI changes
Live-test in the real vault: `npm run build:plugin && node scripts/deploy.mjs` (deploys to the vault at `OBSIDIAN_VAULT_DIR` or the hardcoded default in `scripts/deploy.mjs`), then `obsidian plugin:reload id=obsidian-checkbox-manager`, then use the `obsidian-cli` skill (`obsidian eval code="..."` to drive the DOM, `obsidian dev:screenshot path=...` to see it) — Obsidian must already be open.
