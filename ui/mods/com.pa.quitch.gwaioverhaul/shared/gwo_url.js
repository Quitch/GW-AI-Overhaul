// Owns the engine URL scheme for dynamic URL builders, so a CEF scheme change
// is a one-module fix. Static literals stay literal and are covered by
// scripts/migrate/rewrite-scheme.js instead. See cef-migration.md.
define(() => {
  const UI_SCHEME = "coui://";

  return {
    uiScheme: UI_SCHEME,
    ui: function (path) {
      return UI_SCHEME + path;
    },
    // For game-data paths that already start with "/": the scheme contributes
    // its second slash from the path, matching the engine's "coui:/" + path form.
    gameFile: function (path) {
      return UI_SCHEME.slice(0, -1) + path;
    },
  };
});
