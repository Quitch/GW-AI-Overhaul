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
            Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

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

model.newGameDifficultyIndex(0); // set the lowest difficulty as the default

// gw_start uses ko.applyBindings(model)
model.gwaioDifficultySettings = {
  factionScaling: ko.observable(true),
  easierStart: ko.observable(false),
  tougherCommanders: ko.observable(false),
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
    return loc(model.gwaioDifficultySettings.microTypeDescription()[value]);
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
  ]),
  personalityTagsDescription: ko.observable({
    Default: "!LOC:Default",
    Tutorial: "!LOC:Lobotomy",
    SlowerExpansion: "!LOC:Slower Expansion",
    PreventsWaste: "!LOC:Prevent Waste",
  }),
  personalityTagsChosen: ko.observableArray([]),
  getpersonalityTagsDescription: function (value) {
    return loc(
      model.gwaioDifficultySettings.personalityTagsDescription()[value]
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
  unsavedChanges: ko.observable(false),
  newGalaxyNeeded: ko.observable(false).extend({
    notify: "always",
  }),
};

ko.computed(function () {
  model.gwaioDifficultySettings.factionScaling();
  model.gwaioDifficultySettings.easierStart();
  model.gwaioDifficultySettings.tougherCommanders();
  model.gwaioDifficultySettings.newGalaxyNeeded(true);
});

model.gwaioDifficultySettings.newGalaxyNeeded.subscribe(function () {
  if (model.gwaioDifficultySettings.newGalaxyNeeded()) {
    model.gwaioDifficultySettings.newGalaxyNeeded(false);
    model.makeGame();
  }
});

ko.computed(function () {
  if (model.gwaioDifficultySettings.customDifficulty()) {
    model.gwaioDifficultySettings.bossCommanders();
    model.gwaioDifficultySettings.bountyModeChance();
    model.gwaioDifficultySettings.bountyModeValue();
    model.gwaioDifficultySettings.econBase();
    model.gwaioDifficultySettings.econRatePerDist();
    model.gwaioDifficultySettings.enableCommanderDangerResponses();
    model.gwaioDifficultySettings.factionTechHandicap();
    model.gwaioDifficultySettings.factoryBuildDelayMax();
    model.gwaioDifficultySettings.factoryBuildDelayMin();
    model.gwaioDifficultySettings.ffaChance();
    model.gwaioDifficultySettings.goForKill();
    model.gwaioDifficultySettings.landAnywhereChance();
    model.gwaioDifficultySettings.mandatoryMinions();
    model.gwaioDifficultySettings.maxAdvancedFabbers();
    model.gwaioDifficultySettings.maxBasicFabbers();
    model.gwaioDifficultySettings.microTypeChosen();
    model.gwaioDifficultySettings.minionMod();
    model.gwaioDifficultySettings.perExpansionDelay();
    model.gwaioDifficultySettings.personalityTagsChosen();
    model.gwaioDifficultySettings.priorityScoutMetalSpots();
    model.gwaioDifficultySettings.startingLocationEvaluationRadius();
    model.gwaioDifficultySettings.suddenDeathChance();
    model.gwaioDifficultySettings.unableToExpandDelay();
    model.gwaioDifficultySettings.useEasierSystemTemplate();
    model.gwaioDifficultySettings.unsavedChanges(true);
  }
});

/* Prevent simply switching to CUSTOM difficulty causing unsaved changes to become true
   Ensure switching away from CUSTOM with unsaved changes doesn't stop you starting a war */
model.gwaioDifficultySettings.customDifficulty.subscribe(function () {
  model.gwaioDifficultySettings.unsavedChanges(false);
});

// eslint-disable-next-line no-unused-vars
function gwaioSaveDifficultySettings() {
  model.gwaioDifficultySettings.unsavedChanges(false);
  model.makeGame();
}

// Don't let the player go to war with unsaved custom difficulty changes
model.ready = ko.computed(function () {
  return (
    !!model.newGame() &&
    !!model.activeStartCard() &&
    !model.gwaioDifficultySettings.unsavedChanges()
  );
});

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

$("#game-difficulty-label").after(
  loadHtml(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels_tooltip.html"
  )
);

$("#game-difficulty").replaceWith(
  loadHtml(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.html"
  )
);
locTree($("#game-difficulty"));

$("#game-difficulty").after(
  loadHtml(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_options.html"
  )
);
locTree($("#additional-settings"));
locTree($("#custom-difficulty-settings"));
// Because PA Inc wants to avoid escaping characters in HTML
model.gwaioFactionScalingTooltip =
  "!LOC:The number of enemy factions is adjusted for the galaxy's size.";

requireGW(
  [
    "require",
    "shared/gw_common",
    "shared/gw_credits",
    "shared/gw_factions",
    "pages/gw_start/gw_breeder",
    "pages/gw_start/gw_teams",
    "main/shared/js/star_system_templates",
    "main/game/galactic_war/shared/js/gw_easy_star_systems",
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/tech.js",
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  ],
  function (
    require,
    GW,
    GWCredits,
    GWFactions,
    GWBreeder,
    GWTeams,
    normal_system_templates, // window.star_system_templates is set instead
    easy_system_templates,
    gwaioTech,
    gwaioBank
  ) {
    var difficultyInfo = [
      {
        // Casual
        customDifficulty: false,
        goForKill: false,
        microType: 0,
        mandatoryMinions: 0,
        minionMod: 0.19,
        priority_scout_metal_spots: false,
        useEasierSystemTemplate: true,
        factory_build_delay_min: 0,
        factory_build_delay_max: 12,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: false,
        per_expansion_delay: 0,
        personality_tags: ["Default", "SlowerExpansion"],
        econBase: 0.4,
        econRatePerDist: 0.05,
        max_basic_fabbers: 10,
        max_advanced_fabbers: 5,
        ffa_chance: 21,
        bossCommanders: 1,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 25,
        bountyModeValue: 0.5,
        factionTechHandicap: 3,
      },
      {
        // Iron
        customDifficulty: false,
        goForKill: false,
        microType: 1,
        mandatoryMinions: 0,
        minionMod: 0.24,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags: ["Default", "SlowerExpansion"],
        econBase: 0.5,
        econRatePerDist: 0.075,
        max_basic_fabbers: 10,
        max_advanced_fabbers: 10,
        ffa_chance: 21,
        bossCommanders: 2,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 25,
        bountyModeValue: 0.45,
        factionTechHandicap: 2.5,
        starting_location_evaluation_radius: 100,
      },
      {
        // Bronze
        customDifficulty: false,
        goForKill: true,
        microType: 2,
        mandatoryMinions: 0,
        minionMod: 0.28,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags: ["Default"],
        econBase: 0.6,
        econRatePerDist: 0.1,
        max_basic_fabbers: 15,
        max_advanced_fabbers: 10,
        ffa_chance: 21,
        bossCommanders: 3,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 20,
        bountyModeValue: 0.4,
        factionTechHandicap: 2,
        starting_location_evaluation_radius: 150,
      },
      {
        // Silver
        customDifficulty: false,
        goForKill: true,
        microType: 2,
        mandatoryMinions: 0,
        minionMod: 0.34,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags: ["Default"],
        econBase: 0.7,
        econRatePerDist: 0.1,
        max_basic_fabbers: 15,
        max_advanced_fabbers: 15,
        ffa_chance: 21,
        bossCommanders: 3,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 20,
        bountyModeValue: 0.35,
        factionTechHandicap: 1.5,
        starting_location_evaluation_radius: 200,
      },
      {
        // Gold
        customDifficulty: false,
        goForKill: true,
        microType: 2,
        mandatoryMinions: 0,
        minionMod: 0.44,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags: ["Default", "PreventsWaste"],
        econBase: 0.85,
        econRatePerDist: 0.15,
        max_basic_fabbers: 20,
        max_advanced_fabbers: 15,
        ffa_chance: 21,
        bossCommanders: 4,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 15,
        bountyModeValue: 0.3,
        factionTechHandicap: 1,
        starting_location_evaluation_radius: 250,
      },
      {
        // Platinum
        customDifficulty: false,
        goForKill: true,
        microType: 2,
        mandatoryMinions: 0,
        minionMod: 0.5,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags: ["Default", "PreventsWaste"],
        econBase: 1,
        econRatePerDist: 0.175,
        max_basic_fabbers: 20,
        max_advanced_fabbers: 20,
        ffa_chance: 21,
        bossCommanders: 4,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 15,
        bountyModeValue: 0.25,
        factionTechHandicap: 0.5,
        starting_location_evaluation_radius: 300,
      },
      {
        // Diamond
        customDifficulty: false,
        goForKill: true,
        microType: 2,
        mandatoryMinions: 1,
        minionMod: 0.49,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags: ["Default", "PreventsWaste"],
        econBase: 1.2,
        econRatePerDist: 0.2,
        max_basic_fabbers: 25,
        max_advanced_fabbers: 20,
        ffa_chance: 21,
        bossCommanders: 5,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 10,
        bountyModeValue: 0.2,
        factionTechHandicap: 0,
        starting_location_evaluation_radius: 400,
      },
      {
        // Uber
        customDifficulty: false,
        goForKill: true,
        microType: 2,
        mandatoryMinions: -1,
        minionMod: 0.74,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags: ["Default", "PreventsWaste"],
        econBase: 10,
        econRatePerDist: 0,
        max_basic_fabbers: 25,
        max_advanced_fabbers: 25,
        ffa_chance: 21,
        bossCommanders: 5,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 10,
        bountyModeValue: 0.2,
        factionTechHandicap: 0,
        starting_location_evaluation_radius: 400,
      },
      {
        // Custom
        customDifficulty: true,
      },
    ];

    // ensures custom difficulty shows the previously selected difficulty's values
    ko.computed(function () {
      if (
        difficultyInfo[model.newGameDifficultyIndex() || 0].customDifficulty
      ) {
        model.gwaioDifficultySettings.customDifficulty(true);
      }
      if (
        !difficultyInfo[model.newGameDifficultyIndex() || 0].customDifficulty
      ) {
        model.gwaioDifficultySettings.customDifficulty(false);
        model.gwaioDifficultySettings.goForKill(
          difficultyInfo[model.newGameDifficultyIndex() || 0].goForKill
        );
        model.gwaioDifficultySettings.microTypeChosen(
          difficultyInfo[model.newGameDifficultyIndex() || 0].microType
        );
        model.gwaioDifficultySettings.mandatoryMinions(
          difficultyInfo[model.newGameDifficultyIndex() || 0].mandatoryMinions
        );
        model.gwaioDifficultySettings.minionMod(
          difficultyInfo[model.newGameDifficultyIndex() || 0].minionMod
        );
        model.gwaioDifficultySettings.priorityScoutMetalSpots(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .priority_scout_metal_spots
        );
        model.gwaioDifficultySettings.useEasierSystemTemplate(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .useEasierSystemTemplate
        );
        model.gwaioDifficultySettings.factoryBuildDelayMin(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .factory_build_delay_min
        );
        model.gwaioDifficultySettings.factoryBuildDelayMax(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .factory_build_delay_max
        );
        model.gwaioDifficultySettings.unableToExpandDelay(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .unable_to_expand_delay
        );
        model.gwaioDifficultySettings.enableCommanderDangerResponses(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .enable_commander_danger_responses
        );
        model.gwaioDifficultySettings.perExpansionDelay(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .per_expansion_delay
        );
        model.gwaioDifficultySettings.personalityTagsChosen(
          difficultyInfo[model.newGameDifficultyIndex() || 0].personality_tags
        );
        model.gwaioDifficultySettings.econBase(
          difficultyInfo[model.newGameDifficultyIndex() || 0].econBase
        );
        model.gwaioDifficultySettings.econRatePerDist(
          difficultyInfo[model.newGameDifficultyIndex() || 0].econRatePerDist
        );
        model.gwaioDifficultySettings.maxBasicFabbers(
          difficultyInfo[model.newGameDifficultyIndex() || 0].max_basic_fabbers
        );
        model.gwaioDifficultySettings.maxAdvancedFabbers(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .max_advanced_fabbers
        );
        model.gwaioDifficultySettings.ffaChance(
          difficultyInfo[model.newGameDifficultyIndex() || 0].ffa_chance
        );
        model.gwaioDifficultySettings.bossCommanders(
          difficultyInfo[model.newGameDifficultyIndex() || 0].bossCommanders
        );
        model.gwaioDifficultySettings.startingLocationEvaluationRadius(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .starting_location_evaluation_radius
        );
        model.gwaioDifficultySettings.landAnywhereChance(
          difficultyInfo[model.newGameDifficultyIndex() || 0].landAnywhereChance
        );
        model.gwaioDifficultySettings.suddenDeathChance(
          difficultyInfo[model.newGameDifficultyIndex() || 0].suddenDeathChance
        );
        model.gwaioDifficultySettings.bountyModeChance(
          difficultyInfo[model.newGameDifficultyIndex() || 0].bountyModeChance
        );
        model.gwaioDifficultySettings.bountyModeValue(
          difficultyInfo[model.newGameDifficultyIndex() || 0].bountyModeValue
        );
        model.gwaioDifficultySettings.factionTechHandicap(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .factionTechHandicap
        );
      }
    });

    /* Start of GWAIO implementation of GWDealer */
    if (!model.gwaioTreasureCards) model.gwaioTreasureCards = [];
    model.gwaioTreasureCards.push(
      { id: "gwc_start_storage" },
      { id: "gwc_start_air" },
      { id: "gwc_start_orbital" },
      { id: "gwc_start_bot" },
      { id: "gwc_start_artillery" },
      { id: "gwc_start_subcdr" },
      { id: "gwc_start_combatcdr" },
      { id: "gwc_start_allfactory" },
      { id: "gwaio_start_ceo" },
      { id: "gwaio_start_paratrooper" },
      { id: "nem_start_deepspace" },
      { id: "nem_start_nuke" },
      { id: "nem_start_planetary" },
      { id: "nem_start_tower_rush" },
      { id: "gwaio_start_tourist" },
      { id: "gwaio_start_rapid" }
    );

    if (!model.gwaioNewStartCards) model.gwaioNewStartCards = [];
    model.gwaioNewStartCards.push(
      { id: "gwc_start_storage" },
      { id: "gwaio_start_ceo" },
      { id: "gwaio_start_paratrooper" },
      { id: "nem_start_deepspace" },
      { id: "nem_start_nuke" },
      { id: "nem_start_planetary" },
      { id: "nem_start_tower_rush" },
      { id: "gwaio_start_tourist" },
      { id: "gwaio_start_rapid" }
    );
    _.forEach(model.gwaioNewStartCards, function (cardData) {
      if (!gwaioBank.hasStartCard(cardData))
        model.startCards().push(model.makeUnknown(cardData));
      else model.startCards().push(model.makeKnown(cardData));
    });
    model.startCards.valueHasMutated();

    if (!model.gwaioAllStartCards) model.gwaioAllStartCards = [];
    model.gwaioAllStartCards.push(
      "gwc_start_vehicle",
      "gwc_start_air",
      "gwc_start_bot",
      "gwc_start_orbital",
      "gwc_start_artillery",
      "gwc_start_subcdr",
      "gwc_start_combatcdr",
      "gwc_start_allfactory",
      "gwc_start_storage",
      "gwaio_start_ceo",
      "gwaio_start_paratrooper",
      "nem_start_deepspace",
      "nem_start_nuke",
      "nem_start_planetary",
      "nem_start_tower_rush",
      "gwaio_start_tourist",
      "gwaio_start_rapid"
    );
    var processedStartCards = {};
    var loadCount = model.gwaioAllStartCards.length;
    var loaded = $.Deferred();
    _.forEach(model.gwaioAllStartCards, function (cardId) {
      require(["cards/" + cardId], function (card) {
        card.id = cardId;
        processedStartCards[cardId] = card;
        if (--loadCount === 0) loaded.resolve();
      });
    });

    // GWDealer.dealCard
    var gwaioDealStartCard = function (params) {
      var result = $.Deferred();
      loaded.then(function () {
        var card = _.find(processedStartCards, { id: params.id });
        var context =
          card.getContext && card.getContext(params.galaxy, params.inventory);
        var deal = card.deal && card.deal(params.star, context);
        var product = { id: params.id };
        var cardParams = deal && deal.params;
        if (cardParams && _.isObject(cardParams)) _.extend(product, cardParams);
        card.keep && card.keep(deal, context);
        card.releaseContext && card.releaseContext(context);
        result.resolve(product, deal);
      });
      return result;
    };
    /* end of GWAIO implementation of GWDealer */

    // gw_start.js
    model.makeGame = function () {
      model.newGame(undefined);

      var busyToken = {};
      model.makeGameBusy(busyToken);

      var game = new GW.Game();

      game.name(model.newGameName());
      game.mode(model.mode());
      game.hardcore(model.newGameHardcore());
      game.content(api.content.activeContent());

      var useEasySystems =
        difficultyInfo[model.newGameDifficultyIndex() || 0]
          .useEasierSystemTemplate;
      var systemTemplates = useEasySystems
        ? easy_system_templates
        : star_system_templates;
      var sizes = GW.balance.numberOfSystems;
      var size = sizes[model.newGameSizeIndex()] || 40;

      var aiFactions = _.range(GWFactions.length);
      aiFactions.splice(model.playerFactionIndex(), 1);
      if (model.gwaioDifficultySettings.factionScaling()) {
        var numFactions = model.newGameSizeIndex() + 1;
        aiFactions = _.sample(aiFactions, numFactions);
      }

      if (model.creditsMode()) {
        size = _.reduce(
          GWFactions,
          function (factionSum, faction) {
            return _.reduce(
              faction.teams,
              function (teamSum, team) {
                return teamSum + (team.workers || []).length;
              },
              factionSum + 1
            );
          },
          0
        );
      }

      model.updateCommander();
      game
        .inventory()
        .setTag("global", "playerFaction", model.playerFactionIndex());
      game.inventory().setTag("global", "playerColor", model.playerColor());

      var buildGalaxy = game.galaxy().build({
        seed: model.newGameSeed(),
        size: size,
        difficultyIndex: model.newGameDifficultyIndex() || 0,
        systemTemplates: systemTemplates,
        content: game.content(),
        minStarDistance: 2,
        maxStarDistance: 4,
        maxConnections: 4,
        minimumDistanceBonus: 8,
      });
      var dealStartCard = buildGalaxy.then(function (galaxy) {
        if (model.makeGameBusy() !== busyToken) return;
        return gwaioDealStartCard({
          id: model.activeStartCard().id(),
          inventory: game.inventory(),
          galaxy: galaxy,
          star: galaxy.stars()[galaxy.origin()],
        }).then(function (startCardProduct) {
          game
            .inventory()
            .cards.push(
              startCardProduct || { id: model.activeStartCard().id() }
            );
        });
      });
      var moveIn = dealStartCard.then(function () {
        if (model.makeGameBusy() !== busyToken) return;
        game.move(game.galaxy().origin());

        var star = game.galaxy().stars()[game.currentStar()];
        star.explored(true);

        game.gameState(GW.Game.gameStates.active);
      });
      var populate = moveIn.then(function () {
        if (model.makeGameBusy() !== busyToken) return;

        // Scatter some AIs
        if (!model.creditsMode()) aiFactions = _.shuffle(aiFactions);
        var teams = _.map(aiFactions, GWTeams.getTeam);
        if (model.creditsMode()) {
          // Duplicate the workers so we can keep them unique
          _.forEach(teams, function (team) {
            team.workers = (team.workers || []).slice(0);
          });
        }

        var teamInfo = _.map(teams, function (team, teamIndex) {
          return {
            team: team,
            workers: [],
            faction: aiFactions[teamIndex],
          };
        });

        if (model.creditsMode()) neutralStars = 0;
        else if (model.gwaioDifficultySettings.easierStart())
          var neutralStars = 4;
        else neutralStars = 2;

        return GWBreeder.populate({
          galaxy: game.galaxy(),
          teams: teams,
          neutralStars: neutralStars,
          orderedSpawn: model.creditsMode(),
          spawn: function () {},
          canSpread: function (_, ai) {
            return (
              !model.creditsMode() || !ai || !!teams[ai.team].workers.length
            );
          },
          spread: function (star, ai) {
            var team = teams[ai.team];
            return GWTeams.makeWorker(star, ai, team).then(function () {
              if (team.workers) _.remove(team.workers, { name: ai.name });

              ai.faction = teamInfo[ai.team].faction;
              teamInfo[ai.team].workers.push({
                ai: ai,
                star: star,
              });
            });
          },
          boss: function (star, ai) {
            return GWTeams.makeBoss(
              star,
              ai,
              teams[ai.team],
              systemTemplates
            ).then(function () {
              ai.faction = teamInfo[ai.team].faction;
              teamInfo[ai.team].boss = ai;
            });
          },
          breedToOrigin: game.isTutorial(),
        }).then(function () {
          return teamInfo;
        });
      });

      var finishAis = populate.then(function (teamInfo) {
        if (model.makeGameBusy() !== busyToken) return;

        // DIFFICULTY RAMPING CODE
        var maxDist = _.reduce(
          game.galaxy().stars(),
          function (value, star) {
            return Math.max(star.distance(), value);
          },
          0
        );

        function getRandomArbitrary(min, max) {
          return Math.random() * (max - min) + min;
        }

        var setAIData = function (ai, dist, isBossSystem, isBoss) {
          ai.personality.micro_type = model.gwaioDifficultySettings.microTypeChosen();
          ai.personality.go_for_the_kill = model.gwaioDifficultySettings.goForKill();
          ai.personality.priority_scout_metal_spots = model.gwaioDifficultySettings.priorityScoutMetalSpots();
          ai.personality.factory_build_delay_min = model.gwaioDifficultySettings.factoryBuildDelayMin();
          ai.personality.factory_build_delay_max = model.gwaioDifficultySettings.factoryBuildDelayMax();
          ai.personality.unable_to_expand_delay = model.gwaioDifficultySettings.unableToExpandDelay();
          ai.personality.enable_commander_danger_responses = model.gwaioDifficultySettings.enableCommanderDangerResponses();
          ai.personality.per_expansion_delay = model.gwaioDifficultySettings.perExpansionDelay();
          ai.personality.max_basic_fabbers = model.gwaioDifficultySettings.maxBasicFabbers();
          ai.personality.max_advanced_fabbers = model.gwaioDifficultySettings.maxAdvancedFabbers();
          ai.personality.personality_tags = model.gwaioDifficultySettings.personalityTagsChosen();
          if (
            model.gwaioDifficultySettings.startingLocationEvaluationRadius() > 0
          )
            ai.personality.starting_location_evaluation_radius = model.gwaioDifficultySettings.startingLocationEvaluationRadius();
          if (isBossSystem) {
            ai.econ_rate =
              (model.gwaioDifficultySettings.econBase() +
                maxDist * model.gwaioDifficultySettings.econRatePerDist()) *
              getRandomArbitrary(0.9, 1.1);
            if (isBoss)
              ai.bossCommanders = model.gwaioDifficultySettings.bossCommanders();
          } else {
            ai.econ_rate =
              (model.gwaioDifficultySettings.econBase() +
                dist * model.gwaioDifficultySettings.econRatePerDist()) *
              getRandomArbitrary(0.9, 1.1);
          }
        };

        var buffType = [0, 1, 2, 3, 4]; // 0 = cost; 1 = damage; 2 = health; 3 = speed; 4 = build
        var buffDelay = model.gwaioDifficultySettings.factionTechHandicap();
        var aiInventory = [];
        var bossInventory = [];
        var clusterCommanderInventory = [];
        var clusterBossInventory = [];

        if (model.gwaioDifficultySettings.tougherCommanders()) {
          aiInventory = aiInventory.concat(gwaioTech.tougherCommander[0]);
          bossInventory = bossInventory.concat(gwaioTech.tougherCommander[1]);
          clusterCommanderInventory = clusterCommanderInventory.concat(
            gwaioTech.tougherCommander[2]
          );
          clusterBossInventory = clusterBossInventory.concat(
            gwaioTech.tougherCommander[3]
          );
        }

        _.forEach(teamInfo, function (info) {
          // Setup boss system
          if (info.boss) {
            setAIData(info.boss, maxDist, true, true);
            if (info.boss.isCluster === true)
              info.boss.inventory = aiInventory.concat(
                gwaioTech.clusterCommanders,
                bossInventory,
                clusterCommanderInventory,
                clusterBossInventory
              );
            else info.boss.inventory = aiInventory.concat(bossInventory);
            var numBuffs = Math.floor(maxDist / 2 - buffDelay);
            var typeOfBuffs = _.sample(buffType, numBuffs);
            info.boss.typeOfBuffs = typeOfBuffs; // for intelligence reports
            _.times(typeOfBuffs.length, function (n) {
              info.boss.inventory = info.boss.inventory.concat(
                gwaioTech.factionTechs[info.boss.faction][typeOfBuffs[n]]
              );
            });
            var numMinions = Math.floor(
              model.gwaioDifficultySettings.mandatoryMinions() +
                maxDist * model.gwaioDifficultySettings.minionMod()
            );
            if (numMinions > 0) {
              info.boss.minions = [];
              if (info.boss.isCluster === true) {
                var bossMinion = _.clone(
                  _.sample(
                    _.filter(GWFactions[info.faction].minions, {
                      name: "Security",
                    })
                  )
                );
                setAIData(bossMinion, maxDist, true, false);
                bossMinion.commanderCount = numMinions;
                info.boss.minions.push(bossMinion);
              } else
                _.times(numMinions, function () {
                  bossMinion = _.clone(
                    _.sample(GWFactions[info.faction].minions)
                  );
                  setAIData(bossMinion, maxDist, true, false);
                  info.boss.minions.push(bossMinion);
                });
            }
          }

          // Setup non-boss AI system
          _.forEach(info.workers, function (worker) {
            if (worker.ai.isCluster === true)
              worker.ai.inventory = aiInventory.concat(
                gwaioTech.clusterCommanders,
                clusterCommanderInventory
              );
            else worker.ai.inventory = aiInventory;
            var dist = worker.star.distance();
            setAIData(worker.ai, dist, false, false);
            if (
              Math.random() * 100 <=
              model.gwaioDifficultySettings.landAnywhereChance()
            )
              worker.ai.landAnywhere = true;
            if (
              Math.random() * 100 <=
              model.gwaioDifficultySettings.suddenDeathChance()
            )
              worker.ai.suddenDeath = true;
            if (
              Math.random() * 100 <=
              model.gwaioDifficultySettings.bountyModeChance()
            )
              worker.ai.bountyMode = true;
            worker.ai.bountyModeValue = model.gwaioDifficultySettings.bountyModeValue();
            var numBuffs = Math.floor(dist / 2 - buffDelay);
            var typeOfBuffs = _.sample(buffType, numBuffs);
            worker.ai.typeOfBuffs = typeOfBuffs; // for intelligence reports
            _.times(typeOfBuffs.length, function (n) {
              worker.ai.inventory = worker.ai.inventory.concat(
                gwaioTech.factionTechs[worker.ai.faction][typeOfBuffs[n]]
              );
            });
            var numMinions = Math.floor(
              model.gwaioDifficultySettings.mandatoryMinions() +
                worker.star.distance() *
                  model.gwaioDifficultySettings.minionMod()
            );
            if (numMinions > 0) {
              worker.ai.minions = [];
              if (worker.ai.name === "Security") {
                var minion = _.clone(
                  _.sample(
                    _.filter(GWFactions[info.faction].minions, {
                      name: "Worker",
                    })
                  )
                );
                setAIData(minion, dist, false, false);
                minion.commanderCount =
                  numMinions +
                  Math.floor(
                    model.gwaioDifficultySettings.bossCommanders() / 2
                  );
                worker.ai.minions.push(minion);
              } else if (worker.ai.name === "Worker")
                worker.ai.commanderCount =
                  1 +
                  numMinions +
                  Math.floor(
                    model.gwaioDifficultySettings.bossCommanders() / 2
                  );
              else {
                _.times(numMinions, function () {
                  minion = _.clone(_.sample(GWFactions[info.faction].minions));
                  setAIData(minion, dist, false, false);
                  worker.ai.minions.push(minion);
                });
              }
            }

            // Setup additional factions for FFA
            var availableFactions = _.without(aiFactions, worker.ai.faction);
            _.times(availableFactions.length, function () {
              if (
                Math.random() * 100 <=
                model.gwaioDifficultySettings.ffaChance()
              ) {
                if (worker.ai.foes === undefined) worker.ai.foes = [];
                availableFactions = _.shuffle(availableFactions);
                var foeFaction = availableFactions.splice(0, 1);
                var foeCommander = _.clone(
                  _.sample(GWFactions[foeFaction].minions)
                );
                var numFoes = Math.round((numMinions + 1) / 2);
                if (foeCommander.name === "Worker") {
                  numFoes += Math.floor(
                    model.gwaioDifficultySettings.bossCommanders() / 2
                  );
                }
                setAIData(foeCommander, dist, false, false);
                foeCommander.inventory = [];
                if (foeCommander.isCluster === true)
                  foeCommander.inventory = gwaioTech.clusterCommanders;
                _.times(typeOfBuffs.length, function (n) {
                  foeCommander.inventory = foeCommander.inventory.concat(
                    gwaioTech.factionTechs[foeFaction][typeOfBuffs[n]]
                  );
                });
                foeCommander.commanderCount = numFoes;
                worker.ai.foes.push(foeCommander);
              }
            });
          });
        });

        var gw_intro_systems = [
          {
            name: "!LOC:The Progenitors",
            description:
              "!LOC:What little is clear is that the galaxy was once inhabited by a sprawling empire, seemingly destroyed by conflict. The commanders refer to these beings as The Progenitors. Many commanders believe answers to their origins lie within the ruins of this once great civilization.",
          },
          {
            name: "!LOC:Galactic War",
            description:
              "!LOC:Some commanders fight because it's all they know, while others seek answers to their origins. Conflicts in motivation and creed drive the commanders into a war that is poised to ravage the galaxy for centuries.",
          },
          {
            name: "!LOC:The Commanders",
            description:
              "!LOC:The commanders have slumbered for millions of years, and awaken to a galaxy that contains only echoes of civilization. These ancient war machines now battle across the galaxy, following the only directives they still hold from long ago.",
          },
          {
            name: "!LOC:The Machine Liberation Army",
            description:
              "!LOC:Buried deep within the data banks of the oldest commanders are references to the MLA. Some commanders believe that at one time all the factions fought as one against the Progenitors, while others dismiss this as heresy.",
          },
          {
            name: "!LOC:The Legion",
            description:
              "!LOC:Scattered references point to the Progenitors using their most advanced technologies for some final conflict. Little more is known of the Legion, only that they were defeated.",
          },
          {
            name: "!LOC:The Union",
            description:
              "!LOC:Commanders on the fringes of the galaxy speak of a new force not of the four factions with units of many origins. It is rumoured that their forces include organics.",
          },
          {
            name: "!LOC:Queller",
            description:
              "!LOC:A neural network thought to have originally been used to train new commanders, it has continued its training cycles while they slumbered and is now the deadliest force in the galaxy.",
          },
        ];

        // Replacement for GWDealer.dealBossCards
        var treasurePlanetSetup = true;
        var lockedStartCards = _.filter(model.gwaioTreasureCards, function (
          card
        ) {
          return !GW.bank.hasStartCard(card) && !gwaioBank.hasStartCard(card);
        });
        var treasurePlanetCard = _.sample(lockedStartCards);
        if (treasurePlanetCard) {
          _.extend(treasurePlanetCard, { allowOverflow: true });
          treasurePlanetSetup = false;
        }

        var n = 0;
        gw_intro_systems = _.shuffle(gw_intro_systems);
        _.forEach(game.galaxy().stars(), function (star) {
          var ai = star.ai();
          var system = star.system();
          if (!ai) {
            var intro_system = gw_intro_systems[n];
            if (intro_system) {
              system.name = intro_system.name;
              system.description = intro_system.description;
              n = n + 1;
            }
          } else {
            // eslint-disable-next-line lodash/prefer-filter
            _.forEach(star.system().planets, function (world) {
              if (world.starting_planet === true)
                if (world.planet) world.planet.shuffleLandingZones = true;
                else world.generator.shuffleLandingZones = true;
            });
            if (!ai.bossCommanders && treasurePlanetSetup === false) {
              treasurePlanetSetup = true;
              delete ai.commanderCount;
              delete ai.minions;
              delete ai.foes;
              delete ai.team;
              ai.mirrorMode = true;
              ai.treasurePlanet = true;
              ai.econ_rate =
                model.gwaioDifficultySettings.econBase() +
                maxDist * model.gwaioDifficultySettings.econRatePerDist();
              ai.bossCommanders = model.gwaioDifficultySettings.bossCommanders();
              ai.name = "The Guardians";
              ai.character = "!LOC:Unknown";
              ai.color = [
                [255, 255, 255],
                [255, 192, 203],
              ];
              ai.commander =
                "/pa/units/commanders/raptor_unicorn/raptor_unicorn.json";
              system.description =
                "!LOC:This is a treasure planet, hiding a loadout you have yet to unlock. But beware the guardians! Armed with whatever technology bonuses you bring with you to this planet; they will stop at nothing to defend its secrets.";
              star.cardList().push(treasurePlanetCard);
            }
          }
        });

        if (model.creditsMode()) {
          var origin = game.galaxy().stars()[game.galaxy().origin()];
          origin.system().name = GWCredits.startSystem.name;
          origin.system().description = GWCredits.startSystem.description;
        }
      });

      finishAis.then(function () {
        if (model.makeGameBusy() !== busyToken) return;

        model.makeGameBusy(false);
        model.newGame(game);
        model.updateCommander();
        return game;
      });
    };

    model.makeGameOrRunCredits();
  }
);
