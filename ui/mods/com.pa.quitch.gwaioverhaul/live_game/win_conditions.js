var gwoLiveGameModifiersLoaded;

function gwoLiveGameModifiers() {
  if (gwoLiveGameModifiersLoaded) {
    return;
  }

  gwoLiveGameModifiersLoaded = true;

  try {
    const buildText = ko.observable();

    model.gwoGameOptions = ko.observable();

    // game_options arrive via server_state after mod scripts run, and stock's
    // updateGameOptions keeps only a whitelist of keys - capture the rest here.
    const stockUpdateGameOptions = model.updateGameOptions;
    model.updateGameOptions = function (options) {
      stockUpdateGameOptions.apply(model, arguments);
      if (options) {
        model.gwoGameOptions(options);
      }
    };

    model.gwoGameModifiersText = ko.computed(() => {
      const build = buildText();
      return build ? build(model.gwoGameOptions(), loc) : "";
    });

    // This document's own pixels are never composited to the screen - only
    // panel views render - so the bar lives in the options bar panel, which
    // also pulls this computed via panel.invoke in case it loads after us.
    model.gwoGameModifiersText.subscribe((text) => {
      if (api.panels.options_bar) {
        api.panels.options_bar.message("gwo_game_modifiers", text);
      }
    });

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/live_game/win_conditions_text.js",
      ],
      (winConditionsText) => {
        buildText(winConditionsText);
      },
    );
  } catch (e) {
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
}
gwoLiveGameModifiers();
