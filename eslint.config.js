import js from "@eslint/js";
import lodash from "eslint-plugin-lodash";
import prettier from "eslint-config-prettier/flat";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 6,
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
    plugins: { js, lodash },
    extends: ["js/recommended", "lodash/v3"],
    rules: {
      curly: ["error", "all"],
      "lodash/prefer-lodash-method": ["error", { ignoreMethods: ["split"] }],
      "lodash/prefer-map": "off",
      "lodash/prefer-noop": "off",
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
