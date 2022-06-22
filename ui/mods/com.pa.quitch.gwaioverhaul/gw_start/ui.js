var gwoUILoaded;

if (!gwoUILoaded) {
  gwoUILoaded = true;

  function gwoUI() {
    try {
      model.newGameDifficultyIndex(0); // set the lowest difficulty as the default

      // gw_start uses ko.applyBindings(model)
      model.gwoDifficultySettings = {
        previousSettings: ko
          .observableArray()
          .extend({ local: "gwo_previous_settings" }),
        factionScaling: ko.observable(true),
        systemScaling: ko.observable(true),
        simpleSystems: ko.observable(false),
        easierStart: ko.observable(false),
        ai: ko.observable("Titans"),
        paLore: ko.observable(true).extend({ local: "gwaio_lore_enabled" }),
        techCardDeck: ko.observable("Expanded"),
        customDifficulty: ko.observable(false),
        goForKill: ko.observable("false"),
        microType: ko.observableArray(0).extend({ numeric: 0 }),
        mandatoryMinions: ko.observable(0).extend({
          numeric: 0,
        }),
        minionMod: ko.observable(0).extend({
          numeric: 2,
        }),
        priorityScoutMetalSpots: ko.observable("false"),
        factoryBuildDelayMin: ko.observable(0).extend({
          numeric: 0,
        }),
        factoryBuildDelayMax: ko.observable(0).extend({
          numeric: 0,
        }),
        unableToExpandDelay: ko.observable(0).extend({
          numeric: 0,
        }),
        enableCommanderDangerResponses: ko.observable("false"),
        perExpansionDelay: ko.observable(0).extend({
          numeric: 0,
        }),
        econBase: ko.observable(0).extend({
          numeric: 3,
        }),
        econRatePerDist: ko.observable(0).extend({
          numeric: 3,
        }),
        maxBasicFabbers: ko.observable(0).extend({
          numeric: 0,
        }),
        maxAdvancedFabbers: ko.observable(0).extend({
          numeric: 0,
        }),
        startingLocationEvaluationRadius: ko.observable(0).extend({
          numeric: 0,
        }),
        ffaChance: ko.observable(0).extend({
          numeric: 0,
        }),
        bossCommanders: ko.observable(0).extend({
          numeric: 0,
        }),
        landAnywhereChance: ko.observable(0).extend({
          numeric: 0,
        }),
        suddenDeathChance: ko.observable(0).extend({
          numeric: 0,
        }),
        bountyModeChance: ko.observable(0).extend({
          numeric: 0,
        }),
        bountyModeValue: ko.observable(0).extend({
          numeric: 2,
        }),
        factionTechHandicap: ko.observable(0).extend({
          numeric: 1,
        }),
      };

      if (!_.isEmpty(model.gwoDifficultySettings.previousSettings())) {
        var difficultySettings = model.gwoDifficultySettings;
        var previousSettings = difficultySettings.previousSettings();
        var settingNames = _.keys(model.gwoDifficultySettings);
        _.pull(settingNames, "previousSettings");
        _.forEach(settingNames, function (name, i) {
          difficultySettings[name](previousSettings[i]);
          console.log(difficultySettings[name]());
        });
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

      $(".info_tip").after(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_options.html"
        )
      );
      $("#faction-select").before(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/faction_tooltip.html"
        )
      );
      $("#game-size").before(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/size_tooltip.html"
        )
      );
      var gameDifficultyLabelId = "#game-difficulty-label";
      $(gameDifficultyLabelId).before(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/ai_dropdown.html"
        )
      );
      $(gameDifficultyLabelId).before(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/cards_dropdown.html"
        )
      );
      $(gameDifficultyLabelId).append(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels_tooltip.html"
        )
      );
      var gameDifficultyId = "#game-difficulty";
      $(gameDifficultyId).replaceWith(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.html"
        )
      );
      $("#new-game-right").after(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/ai_settings.html"
        )
      );
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

      // Track difficulty settings so GW-CUSTOM fields appear and display correct values
      requireGW(
        [
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
        ],
        function (gwoDifficulty) {
          ko.computed(function () {
            var selectedDifficulty = model.newGameDifficultyIndex();
            var difficultySettings = model.gwoDifficultySettings;
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
              $("#gwo-personality-picker")
                .selectpicker(
                  "val",
                  difficulties[selectedDifficulty].personality_tags
                )
                .trigger("change");
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
