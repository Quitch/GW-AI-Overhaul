var gwoUILoaded;

function gwoUI() {
  if (gwoUILoaded) {
    return;
  }

  gwoUILoaded = true;

  try {
    ko.extenders.stringBoolean = function (target) {
      var result = ko.computed({
        read: function () {
          return target() ? "true" : "false";
        },
        write: function (newValue) {
          target(newValue === true || newValue === "true");
        },
      });
      result.raw = target;
      return result;
    };

    var koNumeric = function (value, precision) {
      return ko.observable(value).extend({ numeric: precision });
    };

    // gw_start uses ko.applyBindings(model)
    model.gwoDifficultySettings = {
      // Holds a name-keyed snapshot of the last saved settings, e.g.
      // { hardcore: true, factionScaling: false, ... } - see
      // restorePreviousSettings/snapshotSettingsForSave below. May still
      // contain a legacy positional array for players with v6.20 and earlier saves.
      previousSettings: ko
        .observableArray()
        .extend({ local: "gwo_previous_settings" }),
      playerFaction: koNumeric(model.playerFactionIndex(), 0),
      difficultyLevel: koNumeric(0, 0),
      galaxySize: koNumeric(model.newGameSizeIndex(), 0),
      hardcore: ko.observable(model.newGameHardcore()), // boolean
      chosenLoadout: koNumeric(model.activeStartCardIndex(), 0),
      factionScaling: ko.observable(true),
      systemScaling: ko.observable(true),
      simpleSystems: ko.observable(false),
      easierStart: ko.observable(true),
      ai: ko.observable("Penchant"),
      paLore: ko.observable(true),
      techCardDeck: ko.observable("Expanded"),
      customDifficulty: ko.observable(false),
      goForKill: ko.observable(false).extend({ stringBoolean: true }),
      microType: koNumeric(0, 0),
      mandatoryMinions: koNumeric(0, 0),
      minionMod: koNumeric(0, 2),
      priorityScoutMetalSpots: ko
        .observable(false)
        .extend({ stringBoolean: true }),
      factoryBuildDelayMin: koNumeric(0, 0),
      factoryBuildDelayMax: koNumeric(0, 0),
      unableToExpandDelay: koNumeric(0, 0),
      enableCommanderDangerResponses: ko
        .observable(false)
        .extend({ stringBoolean: true }),
      perExpansionDelay: koNumeric(0, 0),
      econBase: koNumeric(0, 3),
      econRatePerDist: koNumeric(0, 3),
      maxBasicFabbers: koNumeric(0, 0),
      maxAdvancedFabbers: koNumeric(0, 0),
      startingLocationEvaluationRadius: koNumeric(0, 0),
      ffaChance: koNumeric(0, 0),
      bossCommanders: koNumeric(0, 0),
      landAnywhereChance: koNumeric(0, 0),
      suddenDeathChance: koNumeric(0, 0),
      bountyModeChance: koNumeric(0, 0),
      bountyModeValue: koNumeric(0, 1),
      factionTechHandicap: koNumeric(0, 1),
      alliedCommanderChance: koNumeric(0, 0),
      personalityTags: ko.observableArray(),
      aiPersonalityAsName: ko.observable(false), // obsolete, left to maintain v6.20 and earlier previous settings integrity
      eradicationModeChance: koNumeric(0, 0),
      aiAlly: ko.observable("Penchant"),
      staticTech: ko.observable(false),
      largePlanets: ko.observable(false),
    };

    var difficultySettings = model.gwoDifficultySettings;

    // duplicate settings we don't own in our view model
    model.newGameSizeIndex = difficultySettings.galaxySize;
    model.newGameHardcore = difficultySettings.hardcore;
    model.activeStartCardIndex = difficultySettings.chosenLoadout;
    model.playerFactionIndex.subscribe(function () {
      difficultySettings.playerFaction(model.playerFactionIndex());
    });

    // Restores previously-saved settings onto `settings`.
    //
    // previousSettings is expected to be a name-keyed object, e.g.
    // { hardcore: true, factionScaling: false, ... }, so a value is only
    // ever written into the setting it was saved from - adding, removing,
    // or reordering settings in gwoDifficultySettings can never cause a
    // saved value to be silently assigned to the wrong setting.
    //
    // Older saves (v6.20 and earlier) may still be sitting in
    // localStorage as a positional array. That legacy shape is supported
    // on a best-effort basis: restore only proceeds if the array length
    // still matches the current setting count, otherwise it's treated as
    // unusable and skipped rather than risk a mismatched restore.
    var restorePreviousSettings = function (settings) {
      var previousSettings = settings.previousSettings();

      if (_.isEmpty(previousSettings)) {
        return settings;
      }

      var settingNames = _.keys(settings);
      _.pull(settingNames, "previousSettings");

      if (_.isArray(previousSettings)) {
        if (previousSettings.length !== settingNames.length) {
          console.error(
            "gwoUI: previousSettings is a legacy array of length " +
              previousSettings.length +
              " but there are now " +
              settingNames.length +
              " settings; skipping restore to avoid misassigning values."
          );
          return settings;
        }
        _.forEach(settingNames, function (name, i) {
          settings[name](previousSettings[i]);
        });
      } else {
        _.forEach(settingNames, function (name) {
          if (_.has(previousSettings, name)) {
            settings[name](previousSettings[name]);
          }
        });
      }

      _.defer(function () {
        $("#gwo-personality-picker")
          .selectpicker("val", settings.personalityTags())
          .trigger("change");
      });
      model.playerFactionIndex(settings.playerFaction());

      return settings;
    };

    difficultySettings = restorePreviousSettings(difficultySettings);

    // Because PA Inc wants to avoid escaping characters in HTML
    model.gwoFactionScalingTooltip =
      "!LOC:The number of enemy factions is adjusted for the galaxy's size.";
    model.gwoBossCommandersTooltip =
      "!LOC:Number of Commanders in the boss's army.";
    // Allow modders to append their deck names
    model.gwoCardsTooltip =
      "!LOC:BASIC: base game tech cards<BR>GALACTIC WAR OVERHAUL: over 100 additional cards.";
    model.gwoFactionTooltip =
      "!LOC:Each faction has its own style of play affecting Sub Commanders and enemy commanders:<br>LEGONIS MACHINA: vehicles<br>FOUNDATION: air/navy<br>SYNCHRONOUS: bots<br>REVENANTS: orbital";

    model.gwoGameOptionsDraft = {
      hardcore: ko.observable(false),
      factionScaling: ko.observable(false),
      systemScaling: ko.observable(false),
      simpleSystems: ko.observable(false),
      largePlanets: ko.observable(false),
      easierStart: ko.observable(false),
      paLore: ko.observable(false),
      staticTech: ko.observable(false),
    };

    var syncGwoGameOptionsDraft = function () {
      var draft = model.gwoGameOptionsDraft;
      draft.hardcore(model.newGameHardcore());
      draft.factionScaling(difficultySettings.factionScaling());
      draft.systemScaling(difficultySettings.systemScaling());
      draft.simpleSystems(difficultySettings.simpleSystems());
      draft.largePlanets(difficultySettings.largePlanets());
      draft.easierStart(difficultySettings.easierStart());
      draft.paLore(difficultySettings.paLore());
      draft.staticTech(difficultySettings.staticTech());
    };

    model.gwoGameOptionsModalVisible = ko.observable(false);
    model.openGwoGameOptionsModal = function () {
      syncGwoGameOptionsDraft();
      model.gwoGameOptionsModalVisible(true);
    };
    model.closeGwoGameOptionsModal = function () {
      syncGwoGameOptionsDraft();
      model.gwoGameOptionsModalVisible(false);
    };
    model.applyGwoGameOptionsModal = function () {
      var draft = model.gwoGameOptionsDraft;
      model.newGameHardcore(draft.hardcore());
      difficultySettings.factionScaling(draft.factionScaling());
      difficultySettings.systemScaling(draft.systemScaling());
      difficultySettings.simpleSystems(draft.simpleSystems());
      difficultySettings.largePlanets(draft.largePlanets());
      difficultySettings.easierStart(draft.easierStart());
      difficultySettings.paLore(draft.paLore());
      difficultySettings.staticTech(draft.staticTech());
      model.gwoGameOptionsModalVisible(false);
    };
    model.toggleGwoBooleanSetting = function (setting) {
      setting(!setting());
    };
    model.gwoBooleanSettingText = function (setting) {
      return setting() ? loc("!LOC:ON") : loc("!LOC:OFF");
    };

    var addHtml = {
      path: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/",
      before: function (classOrId, file) {
        $(classOrId).before(loadHtml(this.path + file));
      },
      after: function (classOrId, file) {
        $(classOrId).after(loadHtml(this.path + file));
      },
      append: function (classOrId, file) {
        $(classOrId).append(loadHtml(this.path + file));
      },
      replace: function (classOrId, file) {
        $(classOrId).replaceWith(loadHtml(this.path + file));
      },
    };
    var gameDifficultyLabelId = "#game-difficulty-label";
    var gameDifficultyId = "#game-difficulty";

    $("#game-settings-label")
      .closest(".form-group")
      .replaceWith(loadHtml(addHtml.path + "difficulty_options.html"));
    addHtml.before("#faction-select", "faction_tooltip.html");
    addHtml.before("#game-size", "size_tooltip.html");
    addHtml.before(gameDifficultyLabelId, "ai_dropdown.html");
    addHtml.before(gameDifficultyLabelId, "cards_dropdown.html");
    addHtml.append(gameDifficultyLabelId, "difficulty_levels_tooltip.html");
    addHtml.replace(gameDifficultyId, "difficulty_levels.html");
    addHtml.after("#new-game-right", "ai_settings.html");
    locTree($(gameDifficultyId));
    locTree($("#gwo-game-options-panel"));
    locTree($("#gwo-game-options-modal"));
    locTree($("#difficulty-options"));
    locTree($("#custom-difficulty-settings"));
    locTree($("#difficulty-cards"));
    locTree($("#difficulty-ai"));

    if (api.content.usingTitans()) {
      model.gwoFactionTooltip =
        model.gwoFactionTooltip +
        loc(
          "!LOC:<br>CLUSTER: land. Uses Angels and Colonels as Sub Commanders and cannot build them."
        );
    } else {
      $("select option[value*='Queller']")
        .prop("disabled", true)
        .selectpicker("refresh");
    }

    // Track difficulty settings so AI Settings' fields display correct values
    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
      ],
      function (gwoDifficulty) {
        ko.computed(function () {
          var selectedDifficulty = difficultySettings.difficultyLevel();
          var difficulties = gwoDifficulty.difficulties;
          if (difficulties[selectedDifficulty].customDifficulty) {
            $("#custom-difficulty-settings select").attr("disabled", false);
            $("select").selectpicker("refresh");
            difficultySettings.customDifficulty(true);
          } else {
            $("#custom-difficulty-settings select").attr("disabled", true);
            $("select").selectpicker("refresh");
            difficultySettings.customDifficulty(false);
            difficultySettings.goForKill(
              difficulties[selectedDifficulty].goForKill
            );
            difficultySettings.microType(
              difficulties[selectedDifficulty].microType
            );
            difficultySettings.mandatoryMinions(
              difficulties[selectedDifficulty].mandatoryMinions
            );
            difficultySettings.minionMod(
              difficulties[selectedDifficulty].minionMod
            );
            difficultySettings.priorityScoutMetalSpots(
              difficulties[selectedDifficulty].priority_scout_metal_spots
            );
            difficultySettings.factoryBuildDelayMin(
              difficulties[selectedDifficulty].factory_build_delay_min
            );
            difficultySettings.factoryBuildDelayMax(
              difficulties[selectedDifficulty].factory_build_delay_max
            );
            difficultySettings.unableToExpandDelay(
              difficulties[selectedDifficulty].unable_to_expand_delay
            );
            difficultySettings.enableCommanderDangerResponses(
              difficulties[selectedDifficulty].enable_commander_danger_responses
            );
            difficultySettings.perExpansionDelay(
              difficulties[selectedDifficulty].per_expansion_delay
            );
            difficultySettings.econBase(
              difficulties[selectedDifficulty].econBase
            );
            difficultySettings.econRatePerDist(
              difficulties[selectedDifficulty].econRatePerDist
            );
            difficultySettings.maxBasicFabbers(
              difficulties[selectedDifficulty].max_basic_fabbers
            );
            difficultySettings.maxAdvancedFabbers(
              difficulties[selectedDifficulty].max_advanced_fabbers
            );
            difficultySettings.ffaChance(
              difficulties[selectedDifficulty].ffa_chance
            );
            difficultySettings.bossCommanders(
              difficulties[selectedDifficulty].bossCommanders
            );
            difficultySettings.startingLocationEvaluationRadius(
              difficulties[selectedDifficulty]
                .starting_location_evaluation_radius
            );
            difficultySettings.landAnywhereChance(
              difficulties[selectedDifficulty].landAnywhereChance
            );
            difficultySettings.suddenDeathChance(
              difficulties[selectedDifficulty].suddenDeathChance
            );
            difficultySettings.bountyModeChance(
              difficulties[selectedDifficulty].bountyModeChance
            );
            difficultySettings.bountyModeValue(
              difficulties[selectedDifficulty].bountyModeValue
            );
            difficultySettings.factionTechHandicap(
              difficulties[selectedDifficulty].factionTechHandicap
            );
            difficultySettings.alliedCommanderChance(
              difficulties[selectedDifficulty].alliedCommanderChance
            );
            difficultySettings.personalityTags(
              difficulties[selectedDifficulty].personality_tags
            );
            $("#gwo-personality-picker")
              .selectpicker("val", difficultySettings.personalityTags())
              .trigger("change");
            difficultySettings.eradicationModeChance(
              difficulties[selectedDifficulty].eradicationModeChance
            );
          }
        });
      }
    );

    model.title = ko.computed(function () {
      return model.mode() || loc("!LOC:Galactic War Overhaul");
    });
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoUI();
