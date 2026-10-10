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
resolvable colors only (`currentColor`, never a CSS custom property) — getting either wrong
renders checkboxes blank with no console error, and `getComputedStyle` still reports the
mask-image property as if correct. If generated CSS/SVG looks right but doesn't render, diff
it byte-for-byte against `git show HEAD:src/<file>` before guessing further.

`src/lucide-icons.ts` bundles the full offline Lucide set (regenerate via
`bun run sync:lucide`) so icons missing from Obsidian's pinned snapshot still resolve, and
backs the icon picker's synonym search. Obsidian silently no-ops `addIcon()` entries
registered under its own `lucide-` prefix, so gap-fill icons live under
`checkbox-manager-lucide-` instead — resolve via `getResolvedIcon()`/`setResolvedIcon()`
(never raw `getIcon`/`setIcon`), which ESLint's `no-restricted-imports` rule enforces
outside `lucide-icons.ts` and test files. `onunload()` removes the gap icons again via
`unregisterLucideIcons()`.

Classes extending Obsidian's `Plugin`/`Modal`/`PluginSettingTab` (`main.ts`, `modal.ts`,
`settings-tab.ts`, `insert-checkbox-modal.ts`) can't be unit-tested — `__mocks__/obsidian.ts`
has none of those classes to instantiate against. Each keeps its testable logic in an
Obsidian-free sibling module (e.g. `checkbox-list.ts`, `checkbox-line.ts`); the class method
stays a thin, untested wrapper.

`icon.ts` is the one seam for filled vs stroke: get `icons` from `iconsFor(style)` and never
branch on the style. Insert icons with `renderIconInto()`; don't hand-roll `icons.render()` +
`sanitizeHTMLToDom()`.

Checkbox-list mutations go through `main.ts`'s `addCheckbox`/`removeCheckbox`/
`updateCheckbox`/`reorderCheckbox` (async; the first three keyed by `symbol`,
`reorderCheckbox` by array index). Each returns a `ListResult` — `{ ok, message }` or
`{ ok: false, reason }` — and saves only when ok; show `message`/`reason` as the Notice
(`settings-tab.ts`'s `applyCheckboxOp` does). Never mutate `settings.checkboxes` directly
from settings-tab.ts/modal.ts.

## Conventions

- New domain concepts (e.g. "Icon") belong in `CONTEXT.md` — check and update it before
  introducing new terminology.
- Deferred/declined architecture decisions go in `docs/adr/` — check
  before re-proposing something already declined.
- Source files use **tabs**. If `Edit`'s `old_string` fails on whitespace, verify the exact
  bytes with `sed -n '<range>p' file | od -c` rather than retyping indentation by eye.

## Live testing

`bun run build:plugin && bun run scripts/deploy.mjs`, then
`obsidian plugin:reload id=obsidian-checkbox-manager`.
