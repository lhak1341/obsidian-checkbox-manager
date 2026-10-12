# Keep Icons as one interface

Status: Accepted — 2026-10-12

`iconsFor(style)` in `icon.ts` returns an `Icons` with ten members. Callers split cleanly: the
render callers (`css-generator.ts`'s `dataUrl`, `icon-render.ts`'s `render`) use two, and the
edit callers (`icon-input.ts`, `modal.ts`, `checkbox-config-form.ts`) use the rest. The
architecture review proposed splitting it into a renderer and an editor, with the
fallback-to-the-other-representation rule written once in the renderer; declined. Each caller
already holds one object and uses only its own members, so a split saves them nothing, while it
adds a second entry point (against CONTEXT.md's "callers hold one `Icons` object") and touches
about 40 call sites in `icon.test.ts`. The fallback is four one-line expressions (render and
dataUrl, for each of the two adapters), and `icon.test.ts` pins it for both styles in both
directions, so moving it would only relocate those lines.

Revisit if a third consumer needs part of `Icons` without the rest, or if a third icon style
makes the fallback order non-trivial.
