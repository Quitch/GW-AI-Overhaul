// The race picker: the player's race and the commander list for the chosen
// race. Only shown when GW Server Mods has a race's server mod active. The
// AI brains are per race, in ai_picker.js's modal. See races.md.
(function () {
  // A throw in the async callbacks below would otherwise escape into
  // RequireJS or GW Server Mods' manifest load unlogged, and Go To War would
  // stay blocked with nothing to say why.
  var logError = function (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  };

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
    // Read by setup.js at Go To War: the races in play, the mods behind them,
    // and the add-on mods the war will record.
    model.gwoRaceInfo = ko.observable({ races: [], mods: [], addonMods: [] });
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
      "!LOC:No enemy faction shares a race with you or another enemy faction until every race in play has been used.";

    $("#faction-select")
      .closest(".form-group")
      .after(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/race_select.html"
        )
      );
    locTree($("#gwo-race-group"));

    $(
      "#gw-start-coop-settings-modal .gw-start-square-switch[data-bind*='toggleDraftNewGamePerPlayerTechCards']"
    )
      .closest(".gw-start-coop-switch-row")
      .after(
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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
      ],
      function (raceMods, races, pickerOptions, gwoAI) {
        try {
          raceMods.registerAll();

          // A commander read before its zip is mounted caches a failure, and the
          // name never recovers, so the list stays MLA's until the mount
          // settles. See races.md.
          var mounted = ko.observable(false);

          // The commander list follows the race; a race's list is its own, and
          // so is the paint its preview art ships in.
          ko.computed(function () {
            var playerRace = settings.playerRace();
            var shownRace = mounted() ? playerRace : races.MLA_ID;
            var choices = pickerOptions.commanderChoices(
              races.byId(shownRace),
              model.commanders(),
              races.MLA_ID
            );
            model.gwoCommanderChoices(choices);
            model.gwoCommanderTintFilter(
              pickerOptions.commanderTint(
                model.playerColor()[0],
                races.commanderArtHue(shownRace)
              )
            );
            if (
              choices.length &&
              !_.includes(choices, model.selectedCommander.peek())
            ) {
              model.selectedCommander(choices[0]);
            }
          });

          // Cluster fields Angels and Colonels, which only MLA has. See races.md.
          ko.computed(function () {
            var cluster = model.playerFactionIndex() === gwoAI.CLUSTER_FACTION;
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
            try {
              var installed = _.pluck(info.races, "id");

              model.gwoRaceOptions(
                _.map(info.races, function (race) {
                  return { id: race.id, name: loc(race.name) };
                })
              );
              $(raceSelectId).html(pickerOptions.optionsHtml(info.races));

              // Cluster's lock has already been applied by the time this
              // resolves, and it outranks the remembered race.
              var wanted = model.gwoRaceSelectDisabled()
                ? races.MLA_ID
                : savedRace;
              settings.playerRace(
                _.includes(installed, wanted) ? wanted : races.MLA_ID
              );
              $(raceSelectId).selectpicker("val", settings.playerRace());
              $(raceSelectId).selectpicker("refresh");

              // Last, as it unblocks Go To War: a throw above leaves the war
              // blocked rather than started on a half-applied race.
              model.gwoRaceInfo(info);

              // Zip mounts only, no content remount. Always, not done: a failed
              // mount must not leave a race's player on MLA's commanders.
              if (model.gwoRacesAvailable()) {
                raceMods.mountRoot().always(function () {
                  mounted(true);
                });
              }
            } catch (e) {
              logError(e);
            }
          });
        } catch (e) {
          logError(e);
        }
      }
    );
  } catch (e) {
    logError(e);
  }
})();
