import js from "@eslint/js";
import esX from "eslint-plugin-es-x";
// ESLint and eslint-plugin-es-x stay on 9.x for this plugin: docs/constraints.md.
import lodash from "eslint-plugin-lodash";
import prettier from "eslint-config-prettier/flat";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js"],
    languageOptions: {
      // A parser setting, not a claim about PA - restrict-to-es5 below does that.
      // Neither raise nor lower it; see constraints.md.
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
        model: "readonly",
        handlers: "readonly",
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
    // Shipped game code. This forbids every post-ES5 feature, syntax and builtins
    // alike; the block below whitelists back what Chrome 40 has. The inversion is
    // deliberate - see constraints.md.
    files: ["ui/**/*.js"],
    ...esX.configs["flat/restrict-to-es5"],
  },
  {
    // Exhaustive, not as-needed: no entry means no. Each trailing comment is the
    // Chrome release that shipped the feature, which must be <= 40.
    files: ["ui/**/*.js"],
    rules: {
      // Array.prototype.values is deliberately absent - Chrome 66.
      "es-x/no-array-prototype-entries": "off", // Chrome 38
      "es-x/no-array-prototype-keys": "off", // Chrome 38
      "es-x/no-for-of-loops": "off", // Chrome 38
      "es-x/no-generators": "off", // Chrome 39
      "es-x/no-map": "off", // Chrome 38
      "es-x/no-math-acosh": "off", // Chrome 38
      "es-x/no-math-asinh": "off", // Chrome 38
      "es-x/no-math-atanh": "off", // Chrome 38
      "es-x/no-math-cbrt": "off", // Chrome 38
      "es-x/no-math-clz32": "off", // Chrome 38
      "es-x/no-math-cosh": "off", // Chrome 38
      "es-x/no-math-expm1": "off", // Chrome 38
      "es-x/no-math-fround": "off", // Chrome 38
      "es-x/no-math-hypot": "off", // Chrome 38
      "es-x/no-math-imul": "off", // Chrome 28
      "es-x/no-math-log10": "off", // Chrome 38
      "es-x/no-math-log1p": "off", // Chrome 38
      "es-x/no-math-log2": "off", // Chrome 38
      "es-x/no-math-sign": "off", // Chrome 38
      "es-x/no-math-sinh": "off", // Chrome 38
      "es-x/no-math-tanh": "off", // Chrome 38
      "es-x/no-math-trunc": "off", // Chrome 38
      "es-x/no-number-epsilon": "off", // Chrome 34
      "es-x/no-number-isfinite": "off", // Chrome 19
      "es-x/no-number-isinteger": "off", // Chrome 34
      "es-x/no-number-isnan": "off", // Chrome 25
      "es-x/no-number-issafeinteger": "off", // Chrome 34
      "es-x/no-number-maxsafeinteger": "off", // Chrome 34
      "es-x/no-number-minsafeinteger": "off", // Chrome 34
      "es-x/no-number-parsefloat": "off", // Chrome 34
      "es-x/no-number-parseint": "off", // Chrome 34
      "es-x/no-object-getownpropertysymbols": "off", // Chrome 38
      "es-x/no-object-is": "off", // Chrome 19
      "es-x/no-object-setprototypeof": "off", // Chrome 34
      "es-x/no-promise": "off", // Chrome 32
      "es-x/no-set": "off", // Chrome 38
      "es-x/no-string-prototype-normalize": "off", // Chrome 34
      "es-x/no-symbol": "off", // Chrome 38
      "es-x/no-typed-arrays": "off", // Chrome 7
      "es-x/no-weak-map": "off", // Chrome 36
      "es-x/no-weak-set": "off", // Chrome 36
    },
  },
  {
    // Already errors via restrict-to-es5. Restated so each reads as deliberate
    // rather than as an oversight next to the whitelist. See constraints.md.
    files: ["ui/**/*.js"],
    rules: {
      "es-x/no-block-scoped-variables": "error",
      "es-x/no-block-scoped-functions": "error",
      // PA's own polyfill makes these one-argument, so they return a wrong answer
      // rather than throwing. Use _.startsWith / _.endsWith.
      "es-x/no-string-prototype-startswith": "error",
      "es-x/no-string-prototype-endswith": "error",
    },
  },
  {
    // PA prefixes each log line with the file and line of the console call, so
    // a logging wrapper would name itself on every line. The rule is the guard.
    files: ["ui/**/*.js"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name='console'][arguments.length>1]",
          message:
            "PA's log keeps only the first console argument; build one string.",
        },
      ],
    },
  },
  {
    // lodash rules for shipped code only: `_` is a PA runtime global that the
    // Node tooling under scripts/ and test/ does not have.
    files: ["ui/**/*.js"],
    plugins: { lodash },
    extends: ["lodash/v3"],
    rules: {
      // Kept: the lodash method stands in for a post-ES5 feature Chrome 40 lacks.
      // prefer-get (optional chaining, ES2020), prefer-includes (includes, ES2015/16),
      // prefer-startswith (startsWith, ES2015; PA's polyfill drops the position arg).
      // Off: the lodash form is only a style preference over an ES5 equivalent.
      "lodash/prefer-compact": "off",
      "lodash/prefer-constant": "off",
      "lodash/prefer-filter": "off",
      "lodash/prefer-lodash-chain": "off",
      "lodash/prefer-lodash-method": "off",
      "lodash/prefer-lodash-typecheck": "off",
      "lodash/prefer-map": "off",
      "lodash/prefer-matches": "off",
      "lodash/prefer-noop": "off",
      "lodash/prefer-reject": "off",
      "lodash/prefer-some": "off",
      "lodash/prefer-thru": "off",
      "lodash/prefer-times": "off",
      "lodash/prefer-wrapper-method": "off",
    },
  },
  {
    // Node-side tooling, not shipped, so not bound by the Chrome 40 constraint.
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
