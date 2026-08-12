import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js"],
    languageOptions: {
      // CEF embeds Chromium 151, so shipped code takes current syntax; the
      // scene-scope rule below is what still constrains it. See constraints.md.
      ecmaVersion: "latest",
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
      "no-unused-vars": [
        "error",
        {
          caughtErrors: "none",
        },
      ],
    },
  },
  {
    // Scene scripts share one scope, and top-level lexical declarations join a
    // shared global lexical environment - a duplicate across mods is a
    // scene-killing SyntaxError. Top-level var/function stay allowed: they are
    // the deliberate cross-scene globals scene scripts already rely on.
    // See constraints.md.
    files: ["ui/**/*.js"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Program > VariableDeclaration[kind='let'], Program > VariableDeclaration[kind='const']",
          message:
            "Top-level let/const joins the scene's shared global lexical scope; keep it inside the define() factory or an IIFE. See constraints.md.",
        },
        {
          selector: "Program > ClassDeclaration",
          message:
            "A top-level class joins the scene's shared global lexical scope; keep it inside the define() factory or an IIFE. See constraints.md.",
        },
      ],
    },
  },
  {
    // Node-side tooling, not shipped, so not bound by the scene-scope rule.
    files: ["scripts/**/*.js", "test/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
  // Prettier config last to disable conflicting rules
  prettier,
]);
