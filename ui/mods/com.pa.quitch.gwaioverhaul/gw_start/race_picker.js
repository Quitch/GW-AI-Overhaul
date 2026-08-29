// The race picker: the player's race, the races the enemy may field, the
// brains that can run them, and the commander list for the chosen race. Only
// shown when GW Server Mods has a race's server mod active. See races.md.
var gwoRacePickerLoaded;

function gwoRacePicker() {
  if (gwoRacePickerLoaded) {
    return;
  }

  gwoRacePickerLoaded = true;

  try {
    var settings = model.gwoDifficultySettings;
    var raceSelectId = "#gwo-race-select";
    var enemyPickerId = "#gwo-enemy-races-picker";
    var brainSelectIds = [
      "#difficulty-ai-enemy-select",
      "#difficulty-ai-ally-select",
    ];

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

    model.gwoRaceTooltip =
      "!LOC:The units you and your Sub Commanders field. Only the TITANS AI knows every race; QUELLER also knows Legion. An AI that does not know a race in play cannot be chosen.";
    model.gwoEnemyRacesTooltip =
      "!LOC:The races enemy factions may field. Each faction draws one; none selected means any.";
    model.gwoUniqueRacesTooltip =
      "!LOC:No two enemy factions share a race until every race in play has been used.";

    // A race's commanders are not in the commander list CommanderUtility read
    // at page load, so their name and portrait come from the spec itself.
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

    var baseOpenCommanderModal = model.openGwoCommanderModal;
    model.openGwoCommanderModal = function () {
      if (model.gwoCommanderMounting()) {
        return;
      }
      baseOpenCommanderModal();
    };

    $("#faction-select")
      .closest(".form-group")
      .after(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/race_select.html"
        )
      );
    locTree($("#gwo-race-group"));
    locTree($("#gwo-enemy-races-group"));

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_mods.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
      ],
      function (raceMods, races) {
        raceMods.registerAll();

        var optionsHtml = function (raceList) {
          return _.map(raceList, function (race) {
            return (
              '<option value="' +
              race.id +
              '">' +
              _.escape(loc(race.name)) +
              "</option>"
            );
          }).join("");
        };

        var readEnemyRaces = function () {
          return $(enemyPickerId).val() || [];
        };

        var mount = function () {
          model.gwoCommanderMounting(true);
          raceMods.mountRoot().always(function () {
            model.gwoCommanderMounting(false);
          });
        };

        // The commander list follows the race; a race's list is its own.
        ko.computed(function () {
          var race = races.byId(settings.playerRace());
          var stock = model.commanders();
          var choices =
            race && race.id !== races.MLA_ID && race.commanders.length
              ? _.pluck(race.commanders, "spec")
              : stock;
          model.gwoCommanderChoices(choices);
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

        // Only a brain that knows every race in play is offered; an unavailable
        // choice falls back to Titans, which knows them all.
        ko.computed(function () {
          var inPlay = [settings.playerRace()].concat(settings.enemyRaces());
          var allowed = races.brainsFor(inPlay);

          _.forEach(brainSelectIds, function (id) {
            $(id + " option").each(function () {
              $(this).prop("disabled", !_.contains(allowed, $(this).val()));
            });
            $(id).selectpicker("refresh");
          });
          if (!_.contains(allowed, settings.ai())) {
            settings.ai(races.TITANS);
          }
          if (!_.contains(allowed, settings.aiAlly())) {
            settings.aiAlly(races.TITANS);
          }
        });

        settings.playerRace.subscribe(function () {
          if (_.isFunction(model.gwoRebuildStartCards)) {
            model.gwoRebuildStartCards();
          }
          if (model.gwoRacesAvailable()) {
            mount();
          }
        });

        $(enemyPickerId).on("change", function () {
          settings.enemyRaces(readEnemyRaces());
        });

        raceMods.installedRaces().then(function (info) {
          var installed = _.pluck(info.races, "id");
          var enemyChoices = _.filter(info.races, function (race) {
            return race.id !== races.MLA_ID;
          });

          model.gwoRaceInfo(info);
          model.gwoRaceOptions(
            _.map(info.races, function (race) {
              return { id: race.id, name: loc(race.name) };
            })
          );
          $(raceSelectId).html(optionsHtml(info.races));
          $(enemyPickerId).html(optionsHtml(enemyChoices));

          if (!_.contains(installed, settings.playerRace())) {
            settings.playerRace(races.MLA_ID);
          }
          settings.enemyRaces(
            _.filter(settings.enemyRaces(), function (id) {
              return _.contains(installed, id);
            })
          );
          $(raceSelectId).selectpicker("val", settings.playerRace());
          $(raceSelectId).selectpicker("refresh");
          $(enemyPickerId).selectpicker("val", settings.enemyRaces());
          $(enemyPickerId).selectpicker("refresh");

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
