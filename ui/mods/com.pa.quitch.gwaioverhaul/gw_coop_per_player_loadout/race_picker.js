// A co-op viewer's own race, when the host generated the war with Separate
// races on. The races on offer are the war's, not this client's - a race the
// host is not running has no units in the battle. See coop.md and races.md.
var gwoViewerRacePickerLoaded;

function gwoViewerRacePicker() {
  if (gwoViewerRacePickerLoaded) {
    return;
  }

  gwoViewerRacePickerLoaded = true;

  try {
    var raceSelectId = "#gwo-viewer-race-select";
    // A viewer shares the host's faction, and Cluster fields Angels and
    // Colonels, which only MLA has. See races.md.
    var CLUSTER_FACTION = 4;

    // The observables the markup binds to exist before the bindings are
    // applied; what fills them arrives later. See shadowing.md.
    model.gwoViewerRace = ko.observable("mla");
    model.gwoViewerRaceOptions = ko.observableArray([]);
    model.gwoViewerRacesAvailable = ko.computed(function () {
      return model.gwoViewerRaceOptions().length > 1;
    });
    model.gwoViewerRaceTooltip =
      "!LOC:The units you and your Sub Commanders field. Only the races the host's war was created with can be chosen.";
    // The war's faction paint on the commander preview, filled once the war
    // has been read.
    model.gwoCommanderTintFilter = ko.observable("");

    // Stock's selectedCommander is a read-only computed over a private index,
    // which the race swap has to be able to set. The base value forwards
    // through, so the arrows and the remembered pick still work.
    var baseSelectedCommander = model.selectedCommander;
    var selectedCommander = ko.observable(baseSelectedCommander());
    baseSelectedCommander.subscribe(selectedCommander);
    model.selectedCommander = selectedCommander;

    // Synchronous, all of it: ko.applyBindings runs as soon as the scene
    // scripts return, and markup injected after that is never bound. The
    // control stays hidden until the war says it has races to offer.
    $("#commander-select p").remove();
    $("#commander-select").prepend(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_coop_per_player_loadout/commander_display.html"
      )
    );
    $("#commander-select")
      .closest(".form-group")
      .after(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_coop_per_player_loadout/race_select.html"
        )
      );
    locTree($("#gwo-viewer-race-group"));

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_coop_per_player_loadout/host_war.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_mods.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_picker_options.js",
      ],
      function (hostWar, raceMods, races, pickerOptions) {
        raceMods.registerAll();

        hostWar.load().then(function (host) {
          // A viewer shares the host's faction, so its commander wears the
          // war's colour. The art hue follows the race whose commanders are
          // on show: the host's race is not swapped in below unless the
          // picker is, and gwoViewerRace stays MLA with it off.
          ko.computed(function () {
            model.gwoCommanderTintFilter(
              pickerOptions.commanderTint(
                host.colour && host.colour[0],
                races.commanderArtHue(model.gwoViewerRace())
              )
            );
          });

          // Nothing at all unless the host asked for it: no control, no mount,
          // and gwo_loadouts.js goes on stamping the host's race.
          if (
            !host.perPlayerRace ||
            host.races.length < 2 ||
            host.faction === CLUSTER_FACTION
          ) {
            return;
          }

          var startingRace = _.contains(_.pluck(host.races, "id"), host.race)
            ? host.race
            : races.MLA_ID;

          model.gwoViewerRaceOptions(
            _.map(host.races, function (race) {
              return { id: race.id, name: loc(race.name) };
            })
          );
          $(raceSelectId).html(pickerOptions.optionsHtml(host.races));
          $(raceSelectId).selectpicker("val", startingRace);
          $(raceSelectId).selectpicker("refresh");
          // After the refresh, not before: refreshing a select whose options
          // were just replaced writes the control's own value back through the
          // binding, which would undo a default set ahead of it.
          model.gwoViewerRace(startingRace);

          // Zip mounts only, no content remount: the commander specs and
          // portraits are read through coui:. See races.md. Waited on - a
          // commander read before its zip is mounted caches a failure, and the
          // name never recovers.
          raceMods.mountRoot().always(function () {
            // Waiting for the stock list too, so the race's does not get
            // overwritten a moment later.
            CommanderUtility.afterCommandersLoaded(function () {
              var stock = model.commanders();

              ko.computed(function () {
                var choices = pickerOptions.commanderChoices(
                  races.byId(model.gwoViewerRace()),
                  stock,
                  races.MLA_ID
                );

                model.commanders(choices);
                if (
                  choices.length &&
                  !_.contains(choices, model.selectedCommander())
                ) {
                  model.selectedCommander(choices[0]);
                }
                if (_.isFunction(model.gwoRebuildStartCards)) {
                  model.gwoRebuildStartCards();
                }
              });
            });
          });
        });
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoViewerRacePicker();
