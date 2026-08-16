// PA renders its UI with CEF, which embeds Chromium 151. Shipped CSS is not
// built, bundled or autoprefixed, and the engine drops what it cannot parse
// silently - no error, no console warning, just a declaration that never
// applies.
//
// Two nets catch that. The plugin below checks every declaration against
// caniuse for .browserslistrc's `chrome 151`, which guards against features
// newer than the engine. The hand-written lists are down to what caniuse
// cannot express: syntax no Blink release ever shipped. See constraints.md.
//
// All CSS in this repo is shipped to the engine, so there is no `overrides`
// block; Node-side CSS, if it ever appears, would need one.

export default {
  extends: ["stylelint-config-standard"],
  plugins: ["stylelint-no-unsupported-browser-features"],
  rules: {
    // The automatic net. severity is "error" against the plugin's own advice:
    // there is no fallback tier here, and stylelint exits 0 on warnings, which
    // would make it decorative in lint:css - a CI hard gate.
    "plugin/no-unsupported-browser-features": [
      true,
      {
        severity: "error",
        // Partial support is exactly what needs reporting here.
        ignorePartialSupport: false,
        ignore: [
          // caniuse marks the whole feature partial for every Chrome because
          // print-color-adjust never shipped; the mask-* and filter uses here
          // are fully supported.
          "css-masks",
          // Partial only over `fill` and `repeat: space`; verified working,
          // and the base game leans on it for every panel frame.
          "border-image",
          // Partial only over external SVG references (url(file.svg#clip));
          // the basic shapes are fully supported.
          "css-clip-path",
        ],
      },
    ],

    // --- Syntax no Blink release ever shipped --------------------------------
    // The plugin cannot flag these - caniuse has no entry to mark them
    // unsupported - so they are banned by hand.
    "at-rule-disallowed-list": [
      "custom-media", // never shipped
      "custom-selector", // never shipped
      "document", // never shipped in Blink, dropped from the spec
      "viewport", // never shipped in Blink
    ],
    "property-disallowed-list": [
      // Never implemented in desktop Blink; iOS-only momentum scrolling.
      "-webkit-overflow-scrolling",
      // Desktop Blink ignores it in both spellings - a mobile-only property.
      "text-size-adjust",
      "-webkit-text-size-adjust",
    ],
    "function-disallowed-list": [
      "constant", // iOS-only alias of env()
      "element", // Firefox only
    ],
    "selector-pseudo-class-disallowed-list": [
      "local-link", // never shipped
      "matches", // never shipped - the :is() proposal name
      "target-within", // never shipped
    ],
    "selector-pseudo-element-disallowed-list": [
      "grammar-error", // never shipped
      "spelling-error", // never shipped
    ],

    // --- House style ---------------------------------------------------------
    // Deliberately stricter than the base game, which mixes snake_case, kebab
    // and uppercase in both classes and ids. The mod's own names stay lower
    // case; the pattern never sees the stock names it selects.
    "selector-class-pattern": [
      "^([a-z][a-z0-9]*)((_|-)[a-z0-9]+)*$",
      {
        message: (selector) =>
          `Expected class selector "${selector}" to be kebab-case or snake_case`,
      },
    ],
    "selector-id-pattern": [
      "^([a-z][a-z0-9]*)((_|-)[a-z0-9]+)*$",
      {
        message: (selector) =>
          `Expected id selector "${selector}" to be kebab-case or snake_case`,
      },
    ],
  },
};
