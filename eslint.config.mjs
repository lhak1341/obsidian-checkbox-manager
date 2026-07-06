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
    ignores: ["dist/**", "node_modules/**"],
  },
]);
