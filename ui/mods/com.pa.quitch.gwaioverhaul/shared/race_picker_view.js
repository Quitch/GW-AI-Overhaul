// A scene script, not an AMD module: gw_start and the co-op loadout scene both
// bind to these before ko.applyBindings runs, so they cannot wait on a
// requireGW. A race's commanders are not in the list CommanderUtility read at
// page load, so their name and portrait come from the spec itself. See
// races.md.
var gwoRacePickerViewLoaded;

function gwoRacePickerView() {
  if (gwoRacePickerViewLoaded) {
    return;
  }

  gwoRacePickerViewLoaded = true;

  try {
    var commanderInfo = {};

    model.gwoCommanderInfo = function (spec) {
      if (!commanderInfo[spec]) {
        commanderInfo[spec] = ko.observable({
          name: CommanderUtility.bySpec.getName(spec),
          image: CommanderUtility.bySpec.getImage(spec),
          profile: CommanderUtility.bySpec.getProfileImage(spec),
        });
        if (!commanderInfo[spec]().name) {
          $.getJSON("coui:/" + spec)
            .done(function (data) {
              var ui = (data && data.client && data.client.ui) || {};
              commanderInfo[spec]({
                name: (data && data.display_name) || spec,
                image: ui.image ? "coui:/" + ui.image : undefined,
                profile: ui.profile_image
                  ? "coui:/" + ui.profile_image
                  : undefined,
              });
            })
            .fail(function () {
              commanderInfo[spec]({ name: spec });
            });
        }
      }
      return commanderInfo[spec]();
    };
    model.gwoCommanderName = function (spec) {
      return model.gwoCommanderInfo(spec).name || "";
    };
    model.gwoCommanderImage = function (spec) {
      return model.gwoCommanderInfo(spec).image || "";
    };
    model.gwoCommanderProfileImage = function (spec) {
      return model.gwoCommanderInfo(spec).profile || "";
    };
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoRacePickerView();
