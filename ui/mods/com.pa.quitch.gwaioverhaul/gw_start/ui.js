var gwoUILoaded;

if (!gwoUILoaded) {
  gwoUILoaded = true;

  function gwoUI() {
    try {
      var koNumeric = function (value, precision) {
        return ko.observable(value).extend({ numeric: precision });
      };

      // gw_start uses ko.applyBindings(model)
      model.gwoDifficultySettings = {
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
        easierStart: ko.observable(false),
        ai: ko.observable("Titans"),
        paLore: ko.observable(true).extend({ local: "gwaio_lore_enabled" }),
        techCardDeck: ko.observable("Expanded"),
        customDifficulty: ko.observable(false),
        goForKill: ko.observable("false"),
        microType: koNumeric(0, 0),
        mandatoryMinions: koNumeric(0, 0),
        minionMod: koNumeric(0, 2),
        priorityScoutMetalSpots: ko.observable("false"),
        factoryBuildDelayMin: koNumeric(0, 0),
        factoryBuildDelayMax: koNumeric(0, 0),
        unableToExpandDelay: koNumeric(0, 0),
        enableCommanderDangerResponses: ko.observable("false"),
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
        personalityTags: ko.observableArray(["Default", "Queller"]),
      };

      var difficultySettings = model.gwoDifficultySettings;

      // duplicate settings we don't own in our view model
      model.newGameSizeIndex = difficultySettings.galaxySize;
      model.newGameHardcore = difficultySettings.hardcore;
      model.activeStartCardIndex = difficultySettings.chosenLoadout;
      model.playerFactionIndex.subscribe(function () {
        difficultySettings.playerFaction(model.playerFactionIndex());
      });

      var previousSettings = difficultySettings.previousSettings();
      if (!_.isEmpty(previousSettings)) {
        var settingNames = _.keys(difficultySettings);
        _.pull(settingNames, "previousSettings");
        _.forEach(settingNames, function (name, i) {
          difficultySettings[name](previousSettings[i]);
        });
        _.defer(function () {
          $("#gwo-personality-picker")
            .selectpicker("val", model.gwoDifficultySettings.personalityTags())
            .trigger("change");
        });
        model.playerFactionIndex(difficultySettings.playerFaction());
      }

      // Because PA Inc wants to avoid escaping characters in HTML
      model.gwoFactionScalingTooltip =
        "!LOC:The number of enemy factions is adjusted for the galaxy's size.";
      model.gwoBossCommandersTooltip =
        "!LOC:Number of Commanders in the boss's army.";
      // Allow modders to append their deck names
      model.gwoCardsTooltip =
        "!LOC:BASIC: base game tech cards<BR>EXPANDED: over 100 additional cards.";
      model.factionTooltip =
        "!LOC:Each faction has its own style of play affecting Sub Commanders and enemy commanders:<br>LEGONIS MACHINA: vehicles<br>FOUNDATION: air/navy<br>SYNCHRONOUS: bots<br>REVENANTS: orbital";

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

      addHtml.append("#game-settings-label", "difficulty_options.html");
      addHtml.before("#faction-select", "faction_tooltip.html");
      addHtml.before("#game-size", "size_tooltip.html");
      addHtml.before(gameDifficultyLabelId, "ai_dropdown.html");
      addHtml.before(gameDifficultyLabelId, "cards_dropdown.html");
      addHtml.append(gameDifficultyLabelId, "difficulty_levels_tooltip.html");
      addHtml.replace(gameDifficultyId, "difficulty_levels.html");
      addHtml.after("#new-game-right", "ai_settings.html");
      locTree($(gameDifficultyId));
      locTree($("#difficulty-options"));
      locTree($("#custom-difficulty-settings"));
      locTree($("#difficulty-ai"));

      if (api.content.usingTitans()) {
        model.factionTooltip =
          model.factionTooltip +
          loc(
            "!LOC:<br>CLUSTER: land. Uses Angels and Colonels as Sub Commanders and cannot build them."
          );
      } else {
        $("select option[value*='Queller']").prop("disabled", true);
      }

      // Track difficulty settings so AI Settings fields display correct values
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
                difficulties[selectedDifficulty]
                  .enable_commander_danger_responses
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
            }
          });
        }
      );
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwoUI();
}
