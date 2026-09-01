// The race picker: the player's race and the commander list for the chosen
// race. Only shown when GW Server Mods has a race's server mod active. The
// AI brains are per race, in ai_picker.js's modal. See races.md.
var gwoRacePickerLoaded;

function gwoRacePicker() {
  if (gwoRacePickerLoaded) {
    return;
  }

  gwoRacePickerLoaded = true;

  try {
    var settings = model.gwoDifficultySettings;
    // The race the last war was started with, read before the bindings run:
    // the select holds only the MLA placeholder until installedRaces()
    // resolves, and Knockout rejects a model value no option can show, writing
    // the placeholder back over it. See races.md.
    var savedRace = settings.playerRace();
    var raceSelectId = "#gwo-race-select";

    // Observables the markup binds to exist before the bindings are applied;
    // the modules that fill them arrive later, so each is written into rather
    // than replaced. See shadowing.md, "Function hijacking".
    model.gwoRaceOptions = ko.observableArray([{ id: "mla", name: "MLA" }]);
    model.gwoRacesAvailable = ko.computed(function () {
      return model.gwoRaceOptions().length > 1;
    });
    // Read by setup.js at Go To War: the races in play and the mods behind them.
    model.gwoRaceInfo = ko.observable({ races: [], mods: [] });
    model.gwoCommanderChoices = ko.observableArray(model.commanders());
    model.gwoRaceSelectDisabled = ko.observable(false);

    // Co-op: each viewer picks its own race at the loadout screen instead of
    // inheriting the host's. Per-player tech is what makes the per-player
    // referee run at all, so this cannot be on without it. See coop.md.
    model.gwoDraftPerPlayerRace = ko.observable(false);
    model.gwoPerPlayerRaceSwitchText = ko.computed(function () {
      return model.gwoDraftPerPlayerRace() &&
        model.draftNewGamePerPlayerTechCards()
        ? loc("!LOC:ON")
        : loc("!LOC:OFF");
    });
    model.toggleGwoDraftPerPlayerRace = function () {
      if (!model.draftNewGamePerPlayerTechCards()) {
        return;
      }
      model.gwoDraftPerPlayerRace(!model.gwoDraftPerPlayerRace());
    };
    model.draftNewGamePerPlayerTechCards.subscribe(function (value) {
      if (!value) {
        model.gwoDraftPerPlayerRace(false);
      }
    });

    // The stock co-op modal owns the draft/apply cycle, so seed from and commit
    // to the setting through its own two functions. See shadowing.md,
    // "Function hijacking".
    var openCoopSettingsModal = model.openCoopSettingsModal;
    model.openCoopSettingsModal = function () {
      openCoopSettingsModal.apply(this, arguments);
      model.gwoDraftPerPlayerRace(
        settings.perPlayerRace() && model.draftNewGamePerPlayerTechCards()
      );
    };
    var applyCoopSettingsModal = model.applyCoopSettingsModal;
    model.applyCoopSettingsModal = function () {
      settings.perPlayerRace(
        model.gwoDraftPerPlayerRace() &&
          !!model.draftNewGamePerPlayerTechCards()
      );
      applyCoopSettingsModal.apply(this, arguments);
    };

    model.gwoPerPlayerRaceTooltip =
      "!LOC:Each player picks their own race when they choose their loadout. Requires Separate loadout &amp; tech.";
    model.gwoRaceTooltip =
      "!LOC:The units you and your Sub Commanders field. Each race's AI is picked with the AI button.";
    model.gwoUniqueRacesTooltip =
      "!LOC:No two enemy factions share a race until every race in play has been used.";

    $("#faction-select")
      .closest(".form-group")
      .after(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/race_select.html"
        )
      );
    locTree($("#gwo-race-group"));

    $("#gw-start-coop-settings-modal .gw-start-coop-settings-body").append(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/coop_race_row.html"
      )
    );
    locTree($("#gwo-per-player-race-row"));

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_mods.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_picker_options.js",
      ],
      function (raceMods, races, pickerOptions) {
        raceMods.registerAll();

        // Zip mounts only, no content remount: quick enough that nothing
        // waits on it.
        var mount = function () {
          raceMods.mountRoot();
        };

        // The commander list follows the race; a race's list is its own, and
        // so is the paint its preview art ships in.
        ko.computed(function () {
          var race = races.byId(settings.playerRace());
          var choices = pickerOptions.commanderChoices(
            race,
            model.commanders(),
            races.MLA_ID
          );
          model.gwoCommanderChoices(choices);
          model.gwoCommanderTintFilter(
            pickerOptions.commanderTint(
              model.playerColor()[0],
              races.commanderArtHue(settings.playerRace())
            )
          );
          if (
            choices.length &&
            !_.contains(choices, model.selectedCommander())
          ) {
            model.selectedCommander(choices[0]);
          }
        });

        // Cluster fields Angels and Colonels, which only MLA has. See races.md.
        ko.computed(function () {
          var cluster = model.playerFaction().name === "Cluster";
          model.gwoRaceSelectDisabled(cluster);
          if (cluster) {
            settings.playerRace(races.MLA_ID);
          }
          $(raceSelectId).prop("disabled", cluster).selectpicker("refresh");
        });

        // One mount covers every race: the zips are the same set whichever
        // race is picked.
        settings.playerRace.subscribe(function () {
          if (_.isFunction(model.gwoRebuildStartCards)) {
            model.gwoRebuildStartCards();
          }
        });

        raceMods.installedRaces().then(function (info) {
          var installed = _.pluck(info.races, "id");

          model.gwoRaceInfo(info);
          model.gwoRaceOptions(
            _.map(info.races, function (race) {
              return { id: race.id, name: loc(race.name) };
            })
          );
          $(raceSelectId).html(pickerOptions.optionsHtml(info.races));

          // Cluster's lock has already been applied by the time this
          // resolves, and it outranks the remembered race.
          var wanted = model.gwoRaceSelectDisabled() ? races.MLA_ID : savedRace;
          settings.playerRace(
            _.contains(installed, wanted) ? wanted : races.MLA_ID
          );
          $(raceSelectId).selectpicker("val", settings.playerRace());
          $(raceSelectId).selectpicker("refresh");

          if (model.gwoRacesAvailable()) {
            mount();
          }
        });
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoRacePicker();
