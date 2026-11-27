// Loads GWO's own translation files through the Mod Translations mod, when it
// is present. Runs from global_mod_list, before the stock scene's
// document.ready, so stock code that translates eagerly (star descriptions in
// gw_play, for one) sees GWO's strings too; a scene-list entry runs too late
// for that. Without the mod GWO's text stays English. See translations.md.
(function () {
  var MOD_ID = "com.pa.quitch.gwaioverhaul";
  // The files in translations/ except the en-US catalog. A language missing
  // here never loads and nothing reports it, so a test compares the two.
  var LANGUAGES = [
    "de",
    "es-ES",
    "fr",
    "it",
    "ja",
    "ko",
    "nl",
    "pl-PL",
    "ru",
    "zh-CN",
    "zh-TW",
  ];

  // Another mod's global: absent, incomplete or throwing are all "no
  // translations", never an error for GWO.
  var register = function (root) {
    var translations = root.ModTranslations;
    if (!translations || !_.isFunction(translations.register)) {
      return undefined;
    }
    try {
      return translations.register(MOD_ID, { languages: LANGUAGES });
    } catch (e) {
      console.error("gwoTranslations: " + (e && e.message ? e.message : e));
      return undefined;
    }
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = { register: register, languages: LANGUAGES };
    return;
  }

  register(window);
})();
