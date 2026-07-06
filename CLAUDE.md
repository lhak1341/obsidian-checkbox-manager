## Architecture

Dynamic CSS generation via an injected `<style>` element is this plugin's core mechanism — it builds per-checkbox CSS rules from user settings (colors, SVG masks) that cannot be expressed as static CSS. The `obsidianmd/no-forbidden-elements` rule is intentionally off for this reason.

## Async callbacks
When async code is needed inside a `void`-typed callback (modal `onSubmit`, DOM event handlers), use `void (async () => { await …; })()` — assigning an `async` function directly fires `@typescript-eslint/no-misused-promises`.

## Lint
`npm run lint` always reports warnings in `deploy.mjs` and `esbuild.config.mjs` (intentional Node.js usage). Run `npx eslint src/` to get the meaningful signal for plugin code.
