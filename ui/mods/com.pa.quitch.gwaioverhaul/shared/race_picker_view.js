// A scene script, not an AMD module: gw_start and the co-op loadout scene both
// bind to these before ko.applyBindings runs, so they cannot wait on a
// requireGW for the bindings themselves. A race's commanders are not in the list CommanderUtility read at
// page load, so their name and portrait come from the spec itself. See
// races.md.
(() => {
  try {
    const commanderInfo = {};

    model.gwoCommanderInfo = (spec) => {
      if (!commanderInfo[spec]) {
        commanderInfo[spec] = ko.observable({
          name: CommanderUtility.bySpec.getName(spec),
          image: CommanderUtility.bySpec.getImage(spec),
          profile: CommanderUtility.bySpec.getProfileImage(spec),
        });
        if (!commanderInfo[spec]().name) {
          // The observable is bound synchronously above; only the spec read
          // waits on the module, so the URL builder can be required here.
          requireGW(
            ["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_url.js"],
            (gwoUrl) => {
              $.getJSON(gwoUrl.gameFile(spec))
                .done((data) => {
                  const ui = (data && data.client && data.client.ui) || {};
                  commanderInfo[spec]({
                    name: (data && data.display_name) || spec,
                    image: ui.image ? gwoUrl.gameFile(ui.image) : undefined,
                    profile: ui.profile_image
                      ? gwoUrl.gameFile(ui.profile_image)
                      : undefined,
                  });
                })
                .fail(() => {
                  commanderInfo[spec]({ name: spec });
                });
            },
          );
        }
      }
      return commanderInfo[spec]();
    };
    model.gwoCommanderName = (spec) => model.gwoCommanderInfo(spec).name || "";
    model.gwoCommanderImage = (spec) =>
      model.gwoCommanderInfo(spec).image || "";
    model.gwoCommanderProfileImage = (spec) =>
      model.gwoCommanderInfo(spec).profile || "";
  } catch (e) {
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
})();
