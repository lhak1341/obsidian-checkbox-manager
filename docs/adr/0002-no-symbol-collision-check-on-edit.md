# No symbol-collision check when editing a checkbox

Status: Accepted — 2026-08-14

`addCheckbox()` refuses to add a checkbox whose symbol already exists (main.ts).
`updateCheckbox()` has no equivalent check: editing a checkbox and retyping its
symbol to match a *different* existing checkbox silently produces two entries
with the same symbol. css-generator.ts keys CSS rules by symbol, so the
earlier of the two stops rendering — no error, no Notice, just a checkbox that
quietly stops working.

Surfaced while routing settings-tab.ts's edit handler through
`plugin.updateCheckbox()` (previously a direct array-index write with the same
gap, just less visible). Left unfixed here — that deepening was about
collapsing duplicated mutate+save+render+notice code, not adding validation
the modal never had.

Revisit by having `updateCheckbox()` reject (or the modal validate) a new
symbol that collides with a checkbox other than the one being edited.
