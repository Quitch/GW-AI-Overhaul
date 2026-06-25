import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 6, // only some ES6 support - PA uses Chrome 40
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.jquery,
        ...globals.amd,
        api: "readonly",
        model: "writable",
        _: "readonly",
        loc: "readonly",
        ko: "readonly",
        requireGW: "readonly",
        star_system_templates: "readonly",
        parse: "readonly",
        createjs: "readonly",
        loadHtml: "readonly",
        locTree: "readonly",
        globals: "readonly",
        CommanderUtility: "readonly",
        Build: "readonly",
        i18n: "readonly",
      },
      sourceType: "script",
    },
    plugins: { js },
    extends: ["js/recommended"],
    rules: {
      curly: ["error", "all"],
    },
  },
  {
    files: ["eslint.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  // Prettier config last to disable conflicting rules
  prettier,
]);
