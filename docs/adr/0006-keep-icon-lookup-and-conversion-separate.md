# Keep icon lookup and conversion separate

Status: Accepted — 2026-10-12

Turning a picked icon name into `CustomIconData` takes two calls in the picker handler in
`icon-input.ts`: `getResolvedIcon()` (`lucide-icons.ts`) finds the SVG element, then
`iconDataFromElement()` (`icon.ts`) converts it. The architecture review proposed one
`iconDataByName()` for both; declined. The handler is the only caller of the pair, so the new
function would move two calls out of a three-line handler and its interface would be as large as
its implementation. It would also have to live in `lucide-icons.ts`, since `icon.ts` stays
Obsidian-free for its unit tests. Each half is already tested on its own, and the whole path is
tested through `attachIconInput`.

Revisit if a second caller needs a name turned into icon data.
