# Keep the Lucide registry as module-level state

Status: Accepted — 2026-10-10

`lucide-icons.ts` holds the native and gap-filled icon name sets as module-level state,
filled by `registerLucideIcons()` and read by `allLucideIconNames()`, `getResolvedIcon()`
and `setResolvedIcon()`. The architecture review proposed returning a registry object from
`registerLucideIcons()` and passing it to `IconSuggest` and the icon input; declined per
"one adapter = hypothetical seam, two adapters = real one" — the only source is Obsidian's
icon API, there is one set of consumers, and tests already reset state by re-calling
`registerLucideIcons()`. Threading a registry parameter through the modal, `attachIconInput`
and `IconSuggest` would add interface for no leverage.

Revisit if a second source of icons appears, or if a bug comes from a lookup running before
`registerLucideIcons()` (today the lookups quietly return empty results, but nothing can
call them before `onload()` has registered).
