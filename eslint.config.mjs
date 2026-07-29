import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 6, // `for...of` loops and Promise usage only - PA uses Chrome 40, does not support ES2015 in full
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
    // Shipped game code. ecmaVersion 6 is set above only so `for...of` and Promise
    // parse; it also makes the parser accept the rest of ES2015, none of which PA's
    // Chrome 40 can run. Without this block an arrow function or template literal
    // passes CI and then SyntaxErrors at scene load, taking the whole file with it.
    files: ["ui/**/*.js"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ArrowFunctionExpression",
          message:
            "Arrow functions are ES2015; PA runs Chrome 40. Use function.",
        },
        {
          selector: "VariableDeclaration[kind!='var']",
          message: "let/const are ES2015; PA runs Chrome 40. Use var.",
        },
        {
          selector: ":matches(TemplateLiteral, TaggedTemplateExpression)",
          message:
            "Template literals are ES2015; PA runs Chrome 40. Use string concatenation.",
        },
        {
          selector: ":matches(ClassDeclaration, ClassExpression)",
          message:
            "class is ES2015; PA runs Chrome 40. Use a constructor function and prototype.",
        },
        {
          selector: ":matches(ObjectPattern, ArrayPattern)",
          message: "Destructuring is ES2015; PA runs Chrome 40.",
        },
        {
          selector: ":matches(AssignmentPattern, RestElement, SpreadElement)",
          message:
            "Default, rest and spread arguments are ES2015; PA runs Chrome 40.",
        },
        {
          selector: "Property[shorthand=true], Property[method=true]",
          message:
            "Shorthand properties and methods are ES2015; PA runs Chrome 40. Write key: value.",
        },
        {
          selector: "Property[computed=true]",
          message: "Computed property names are ES2015; PA runs Chrome 40.",
        },
        {
          selector:
            ":matches(FunctionDeclaration, FunctionExpression)[generator=true]",
          message: "Generators are ES2015; PA runs Chrome 40.",
        },
      ],
    },
  },
  {
    // Node-side test/CI tooling - not shipped to the game, not bound to its Chrome 40
    // constraint, so these get real Node globals instead of the browser/engine ones above.
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
