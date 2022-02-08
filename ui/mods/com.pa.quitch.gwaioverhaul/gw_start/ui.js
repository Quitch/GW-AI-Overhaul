var gwoUILoaded;

if (!gwoUILoaded) {
  gwoUILoaded = true;

  function gwoUI() {
    try {
      ko.extenders.decimals = function (target, decimals) {
        // create a writable computed observable to intercept writes to our observable
        var result = ko
          .pureComputed({
            read: target, // always return the original observables value
            write: function (newValue) {
              if (_.isString(newValue)) {
                newValue = newValue.replace(",", ".");

                newValue = parseFloat(newValue);
                if (!isNaN(newValue)) {
                  target(newValue);
                }
              }
              var current = target(),
                roundingMultiplier = Math.pow(10, decimals),
                newValueAsNum = isNaN(newValue) ? 0 : +newValue,
                valueToWrite =
                  Math.round(newValueAsNum * roundingMultiplier) /
                  roundingMultiplier;

              // only write if it changed
              if (valueToWrite !== current) {
                target(valueToWrite);
              } else {
                /* if the rounded value is the same, but a different value was
             written, force a notification for the current field */
                if (newValue !== current) {
                  target.notifySubscribers(valueToWrite);
                }
              }
            },
          })
          .extend({ notify: "always" });

        // initialize with current value to make sure it is rounded appropriately
        result(target());

        return result; // return the new computed observable
      };

      // gw_start uses ko.applyBindings(model)
      model.gwoDifficultySettings = {
        factionScaling: ko.observable(true),
        systemScaling: ko.observable(true),
        easierStart: ko.observable(false),
        ai: ko.observable(0).extend({ numeric: 0 }),
        paLore: ko.observable(true).extend({ local: "gwaio_lore_enabled" }),
        customDifficulty: ko.observable(false),
        goForKill: ko.observable(false),
        microType: ko.observableArray([0, 1, 2]),
        microTypeDescription: ko.observable({
          0: "!LOC:No",
          1: "!LOC:Basic",
          2: "!LOC:Advanced",
        }),
        microTypeChosen: ko.observable(0),
        getmicroTypeDescription: function (value) {
          return loc(model.gwoDifficultySettings.microTypeDescription()[value]);
        },
        mandatoryMinions: ko.observable(0).extend({
          decimals: 2,
        }),
        minionMod: ko.observable(0).extend({
          decimals: 2,
        }),
        priorityScoutMetalSpots: ko.observable(false),
        useEasierSystemTemplate: ko.observable(false),
        factoryBuildDelayMin: ko.observable(0).extend({
          decimals: 0,
        }),
        factoryBuildDelayMax: ko.observable(0).extend({
          decimals: 0,
        }),
        unableToExpandDelay: ko.observable(0).extend({
          decimals: 0,
        }),
        enableCommanderDangerResponses: ko.observable(false),
        perExpansionDelay: ko.observable(0).extend({
          decimals: 0,
        }),
        personalityTags: ko.observableArray([
          "Default",
          "Tutorial",
          "SlowerExpansion",
          "PreventsWaste",
          "queller",
        ]),
        personalityTagsDescription: ko.observable({
          Default: "!LOC:Default",
          Tutorial: "!LOC:Lobotomy",
          SlowerExpansion: "!LOC:Slower Expansion",
          PreventsWaste: "!LOC:Prevent Waste",
          queller: "!LOC:Queller",
        }),
        personalityTagsChosen: ko.observableArray([]),
        getpersonalityTagsDescription: function (value) {
          return loc(
            model.gwoDifficultySettings.personalityTagsDescription()[value]
          );
        },
        econBase: ko.observable(0).extend({
          decimals: 2,
        }),
        econRatePerDist: ko.observable(0).extend({
          decimals: 2,
        }),
        maxBasicFabbers: ko.observable(0).extend({
          decimals: 0,
        }),
        maxAdvancedFabbers: ko.observable(0).extend({
          decimals: 0,
        }),
        startingLocationEvaluationRadius: ko.observable(0).extend({
          decimals: 0,
        }),
        ffaChance: ko.observable(0).extend({
          decimals: 0,
        }),
        bossCommanders: ko.observable(0).extend({
          decimals: 0,
        }),
        landAnywhereChance: ko.observable(0).extend({
          decimals: 0,
        }),
        suddenDeathChance: ko.observable(0).extend({
          decimals: 0,
        }),
        bountyModeChance: ko.observable(0).extend({
          decimals: 0,
        }),
        bountyModeValue: ko.observable(0).extend({
          decimals: 2,
        }),
        factionTechHandicap: ko.observable(0).extend({
          decimals: 2,
        }),
      };

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
      locTree($(gameDifficultyId));
      $(gameDifficultyId).after(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_options.html"
        )
      );
      locTree($("#difficulty-options"));
      locTree($("#custom-difficulty-settings"));
      // Because PA Inc wants to avoid escaping characters in HTML
      model.gwoFactionScalingTooltip =
        "!LOC:The number of enemy factions is adjusted for the galaxy's size.";

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
              difficultySettings.customDifficulty(true);
            } else {
              difficultySettings.customDifficulty(false);
              difficultySettings.goForKill(
                difficulties[selectedDifficulty].goForKill
              );
              difficultySettings.microTypeChosen(
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
              difficultySettings.useEasierSystemTemplate(
                difficulties[selectedDifficulty].useEasierSystemTemplate
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
              difficultySettings.personalityTagsChosen(
                difficulties[selectedDifficulty].personality_tags
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
