var gwoCoopSelectionLoaded;

function gwoCoopSelection() {
  if (gwoCoopSelectionLoaded || model.game().isTutorial()) {
    return;
  }

  gwoCoopSelectionLoaded = true;

  try {
    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_selection_follow.js",
      ],
      function (gwoSelectionFollow) {
        // systems.js replaces model.selection outright, so the subscription can
        // only be taken once every gw_play mod has loaded.
        _.defer(function () {
          gwoSelectionFollow({ game: model.game() });
        });
      }
    );
  } catch (e) {
    console.error(e);
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoCoopSelection();
