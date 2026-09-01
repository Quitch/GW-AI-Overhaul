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

    var koStringBoolean = function (value) {
      return ko.observable(value).extend({ stringBoolean: true });
    };

    var koNumeric = function (value, precision) {
      return ko.observable(value).extend({ numeric: precision });
    };

    // gw_start uses ko.applyBindings(model)
    model.gwoDifficultySettings = {
      // Name-keyed, but may be a legacy positional array on v6.2.0 and earlier saves.
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
      paLore: ko.observable(false),
      techCardDeck: ko.observable("Expanded"),
      customDifficulty: ko.observable(false),
      goForKill: koStringBoolean(false),
      microType: koNumeric(0, 0),
      mandatoryMinions: koNumeric(0, 0),
      minionMod: koNumeric(0, 2),
      priorityScoutMetalSpots: koStringBoolean(false),
      factoryBuildDelayMin: koNumeric(0, 0),
      factoryBuildDelayMax: koNumeric(0, 0),
      unableToExpandDelay: koNumeric(0, 0),
      enableCommanderDangerResponses: koStringBoolean(false),
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
      aiPersonalityAsName: ko.observable(false), // obsolete, left to maintain v6.2.0 and earlier previous settings integrity
      eradicationModeChance: koNumeric(0, 0),
      aiAlly: ko.observable("Penchant"),
      staticTech: ko.observable(false),
      largePlanets: ko.observable(false),
      // Race id; see races.md.
      playerRace: ko.observable("mla"),
      uniqueRaces: ko.observable(false),
      // Co-op only, and only alongside per-player tech. See coop.md.
      perPlayerRace: ko.observable(false),
      // { raceId: { enemy, ally } } for non-MLA races; ai/aiAlly above are
      // the MLA row. Stale ids are kept so a reinstalled race remembers its
      // brains. See races.md.
      aiByRace: ko.observable({}),
    };

    var difficultySettings = model.gwoDifficultySettings;

    // duplicate settings we don't own in our view model
    model.newGameSizeIndex = difficultySettings.galaxySize;
    model.newGameHardcore = difficultySettings.hardcore;
    model.activeStartCardIndex = difficultySettings.chosenLoadout;
    model.playerFactionIndex.subscribe(function () {
      difficultySettings.playerFaction(model.playerFactionIndex());
    });

    // The legacy array shape is positional, so it is only restored while its
    // length still matches the setting count - past that, values misassign.
    var restorePreviousSettings = function (settings) {
      var previousSettings = settings.previousSettings();

      if (_.isEmpty(previousSettings)) {
        return settings;
      }

      var settingNames = _.without(_.keys(settings), "previousSettings");

      if (_.isArray(previousSettings)) {
        if (previousSettings.length !== settingNames.length) {
          console.warn(
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

    // Tooltip text lives here, not in the HTML: the base-game markup pipeline
    // won't carry escaped characters through a tooltip attribute.
    model.gwoFactionScalingTooltip =
      "!LOC:The number of enemy factions is adjusted for the galaxy's size.";
    model.gwoBossCommandersTooltip =
      "!LOC:Number of Commanders in the boss's army.";
    // deck_picker.js appends a line per third-party deck
    model.gwoCardsTooltip =
      "!LOC:BASIC: base game tech cards<BR>GALACTIC WAR OVERHAUL: over 150 additional cards.";
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
      uniqueRaces: ko.observable(false),
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
      draft.uniqueRaces(difficultySettings.uniqueRaces());
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
      difficultySettings.uniqueRaces(draft.uniqueRaces());
      model.gwoGameOptionsModalVisible(false);
    };
    model.toggleGwoBooleanSetting = function (setting) {
      setting(!setting());
    };
    model.gwoBooleanSettingText = function (setting) {
      return setting() ? loc("!LOC:ON") : loc("!LOC:OFF");
    };

    // Stock's selectedCommander is a read-only computed over a private index the
    // modal cannot set, so swap in a writable observable and forward the base
    // value through - it still resolves the initial pick, after this runs.
    var baseSelectedCommander = model.selectedCommander;
    var selectedCommander = ko.observable(baseSelectedCommander());
    baseSelectedCommander.subscribe(selectedCommander);
    model.selectedCommander = selectedCommander;
    selectedCommander.subscribe(function () {
      model.updateCommander();
    });

    // The faction paint on the commander preview; race_picker.js fills it, once
    // it knows the hue the race's art ships in.
    model.gwoCommanderTintFilter = ko.observable("");

    model.gwoCommanderModalVisible = ko.observable(false);
    model.gwoCommanderDraft = ko.observable(model.selectedCommander());
    model.gwoDraftCommanderName = ko.computed(function () {
      return CommanderUtility.bySpec.getName(model.gwoCommanderDraft());
    });
    model.openGwoCommanderModal = function () {
      model.gwoCommanderDraft(model.selectedCommander());
      model.gwoCommanderModalVisible(true);
    };
    model.closeGwoCommanderModal = function () {
      model.gwoCommanderDraft(model.selectedCommander());
      model.gwoCommanderModalVisible(false);
    };
    model.applyGwoCommanderModal = function () {
      model.selectedCommander(model.gwoCommanderDraft());
      model.gwoCommanderModalVisible(false);
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
    // Same reason as the commander modal below, plus it keeps a hidden node out
    // of the Setup column's scroll flow.
    $("#gwo-game-options-modal").appendTo("body");
    addHtml.before("#faction-select", "faction_tooltip.html");
    addHtml.before("#game-size", "size_tooltip.html");
    addHtml.before(gameDifficultyLabelId, "cards_dropdown.html");
    addHtml.append(gameDifficultyLabelId, "difficulty_levels_tooltip.html");
    addHtml.replace(gameDifficultyId, "difficulty_levels.html");
    addHtml.after("#new-game-right", "ai_settings.html");
    // Stock hides this outright. It is useful now that a seed reproduces a war.
    $("#game-seed").closest(".form-group").css("display", "");
    addHtml.before("#game-seed", "seed_tooltip.html");
    $("#new-game-left").remove();
    addHtml.before("#gwo-game-options-panel", "commander_button.html");
    // Must hang off body: the modal is position: absolute, and in the Setup
    // column it would resolve against a short, scrolling ancestor.
    addHtml.append("body", "commander_modal.html");
    locTree($(gameDifficultyId));
    locTree($("#gwo-commander-panel"));
    locTree($("#gwo-commander-modal"));
    locTree($("#gwo-game-options-panel"));
    locTree($("#gwo-game-options-modal"));
    locTree($("#difficulty-options"));
    // Not #custom-difficulty-settings, which starts below the panel's own header
    // and so leaves that header's <loc> unreached.
    locTree($("#gwo-ai-settings"));
    locTree($("#difficulty-cards"));

    if (api.content.usingTitans()) {
      model.gwoFactionTooltip =
        model.gwoFactionTooltip +
        loc(
          "!LOC:<br>CLUSTER: land. Uses Angels and Colonels as Sub Commanders and cannot build them."
        );
    }

    // Track difficulty settings so AI Settings' fields display correct values
    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
      ],
      function (gwoDifficulty) {
        // Scoped, not a bare $("select"): only these change disabled state here,
        // and refreshing the rest on every difficulty change costs time for nothing.
        var customDifficultySelects = "#custom-difficulty-settings select";

        ko.computed(function () {
          var selectedDifficulty = difficultySettings.difficultyLevel();
          var difficulties = gwoDifficulty.difficulties;
          if (difficulties[selectedDifficulty].customDifficulty) {
            $(customDifficultySelects).attr("disabled", false);
            $(customDifficultySelects).selectpicker("refresh");
            difficultySettings.customDifficulty(true);
          } else {
            $(customDifficultySelects).attr("disabled", true);
            $(customDifficultySelects).selectpicker("refresh");
            difficultySettings.customDifficulty(false);
            var tier = difficulties[selectedDifficulty];
            _.forEach(gwoDifficulty.tierSettings, function (setting) {
              var value = tier[setting.key];
              difficultySettings[setting.name](value);
              if (setting.name === "personalityTags") {
                // From the difficulty data, not by reading personalityTags
                // back - that makes this computed a dependency of the
                // observable it writes.
                $("#gwo-personality-picker")
                  .selectpicker("val", value)
                  .trigger("change");
              }
            });
          }
        });
      }
    );

    model.title = ko.computed(function () {
      return model.mode() || loc("!LOC:Galactic War Overhaul");
    });
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoUI();
