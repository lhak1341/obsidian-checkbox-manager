import tsparser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  ...obsidianmd.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: "./tsconfig.json" },
    },
    rules: {
      // Dynamic CSS generation is this plugin's core feature; static styles.css is insufficient
      "obsidianmd/no-forbidden-elements": "off",
      // Declarative settings API (getSettingDefinitions) is a future migration; display() still works
      "obsidianmd/settings-tab/prefer-setting-definitions": "off",
      // Obsidian has no native confirm() replacement; custom modal is out of scope
      "no-alert": "off",
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      // Test files run outside Obsidian's runtime — createEl/createDiv don't exist until a test
      // polyfills them, and raw document.createElement() builds the containers that stand in for them.
      "obsidianmd/prefer-create-el": "off",
      // No popout-window concept in a jsdom test sandbox — globalThis is the only global there is.
      "obsidianmd/no-global-this": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**"],
  },
]);
