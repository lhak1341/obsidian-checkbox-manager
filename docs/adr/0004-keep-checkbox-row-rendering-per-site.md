# Keep checkbox row rendering per site

Status: Accepted — 2026-10-12

The settings list (`settings-tab.ts`), the insert suggestion (`insert-checkbox-modal.ts`) and
the config modal's preview (`modal.ts`) each render a symbol, an icon and a name. The
architecture review proposed one shared row renderer; declined. The three rows differ on
purpose: the list and the suggestion colour `[x]` with `--checkbox-color` and wrap a 16px icon,
while the modal preview shows an uncoloured grey chip beside a 20px icon next to a validation
message. A shared `renderCheckboxRow()` would need a class prefix and per-site options to cover
those differences, so its interface would be about as large as the six lines it replaces, and
the CSS would stay in three copies. `renderIconInto()` already holds the part that is common.

Revisit if a fourth row appears, or if the modal preview is meant to look exactly like the list
row.
