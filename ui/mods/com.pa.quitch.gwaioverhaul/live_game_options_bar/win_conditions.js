var gwoOptionsBarModifiersLoaded;

function gwoOptionsBarModifiers() {
  if (gwoOptionsBarModifiersLoaded) {
    return;
  }

  gwoOptionsBarModifiersLoaded = true;

  try {
    model.gwoGameModifiersText = ko.observable("");
    model.gwoGameModifiersText.subscribe(function () {
      api.Panel.onBodyResize();
      _.delay(api.Panel.onBodyResize);
    });

    handlers.gwo_game_modifiers = function (payload) {
      model.gwoGameModifiersText(payload || "");
    };

    $(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/live_game/options_bar_modifiers.html"
      )
    ).insertBefore($(".wrapper_ingame_options_bar"));

    var stockSetup = model.setup;
    model.setup = function () {
      stockSetup();
      api.Panel.query(api.Panel.parentId, "panel.invoke", [
        "gwoGameModifiersText",
      ]).then(function (text) {
        if (text) {
          model.gwoGameModifiersText(text);
        }
      });
    };
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoOptionsBarModifiers();
