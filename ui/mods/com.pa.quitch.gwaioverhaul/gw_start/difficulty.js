ko.extenders.precision = function (target, precision) {
  //create a writable computed observable to intercept writes to our observable
  var result = ko
    .pureComputed({
      read: target, //always return the original observables value
      write: function (newValue) {
        if (_.isString(newValue)) {
          newValue = newValue.replace(",", ".");

          newValue = parseFloat(newValue);
          if (!isNaN(newValue)) {
            target(newValue);
          }
        }
        var current = target(),
          roundingMultiplier = Math.pow(10, precision),
          newValueAsNum = isNaN(newValue) ? 0 : +newValue,
          valueToWrite =
            Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

        //only write if it changed
        if (valueToWrite !== current) {
          target(valueToWrite);
        } else {
          //if the rounded value is the same, but a different value was written, force a notification for the current field
          if (newValue !== current) {
            target.notifySubscribers(valueToWrite);
          }
        }
      },
    })
    .extend({ notify: "always" });

  //initialize with current value to make sure it is rounded appropriately
  result(target());

  //return the new computed observable
  return result;
};

model.newGameDifficultyIndex(0); // set the lowest difficulty as the default

// gw_start uses ko.applyBindings(model) so we put ourselves within that variable
model.gwaioDifficultySettings = {
  factionScaling: ko.observable(true),
  easierStart: ko.observable(false),
  tougherCommanders: ko.observable(false),
  mirrorMode: ko.observable(false),
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
    precision: 3,
  }),
  minionMod: ko.observable(0).extend({
    precision: 3,
  }),
  priorityScoutMetalSpots: ko.observable(false),
  useEasierSystemTemplate: ko.observable(false),
  factoryBuildDelayMin: ko.observable(0).extend({
    precision: 0,
  }),
  factoryBuildDelayMax: ko.observable(0).extend({
    precision: 0,
  }),
  unableToExpandDelay: ko.observable(0).extend({
    precision: 0,
  }),
  enableCommanderDangerResponses: ko.observable(false),
  perExpansionDelay: ko.observable(0).extend({
    precision: 0,
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
    precision: 3,
  }),
  econRatePerDist: ko.observable(0).extend({
    precision: 3,
  }),
  maxBasicFabbers: ko.observable(0).extend({
    precision: 0,
  }),
  maxAdvancedFabbers: ko.observable(0).extend({
    precision: 0,
  }),
  startingLocationEvaluationRadius: ko.observable(0).extend({
    precision: 0,
  }),
  ffaChance: ko.observable(0).extend({
    precision: 0,
  }),
  bossCommanders: ko.observable(0).extend({
    precision: 0,
  }),
  landAnywhereChance: ko.observable(0).extend({
    precision: 0,
  }),
  suddenDeathChance: ko.observable(0).extend({
    precision: 0,
  }),
  bountyModeChance: ko.observable(0).extend({
    precision: 0,
  }),
  bountyModeValue: ko.observable(0).extend({
    precision: 3,
  }),
  factionTechHandicap: ko.observable(0).extend({
    precision: 0,
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
  model.gwaioDifficultySettings.mirrorMode();
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

$("#game-difficulty-label").after(
  loadHtml(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_tooltip.html"
  )
);

$("#game-difficulty").html(
  loadHtml(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.html"
  )
);
locTree(document.getElementById("game-difficulty"));

$("#game-difficulty").after(
  loadHtml(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_options.html"
  )
);
locTree(document.getElementById("additional-settings"));
locTree(document.getElementById("custom-difficulty-settings"));

requireGW(
  [
    "shared/gw_common",
    "shared/gw_credits",
    "shared/gw_factions",
    "pages/gw_start/gw_breeder",
    "pages/gw_start/gw_dealer",
    "pages/gw_start/gw_teams",
    "main/shared/js/star_system_templates",
    "main/game/galactic_war/shared/js/gw_easy_star_systems",
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/tech.js",
  ],
  function (
    GW,
    GWCredits,
    GWFactions,
    GWBreeder,
    GWDealer,
    GWTeams,
    normal_system_templates /* this actually won't load -- window.star_system_templates is set instead */,
    easy_system_templates,
    gwaioTech
  ) {
    var difficultyInfo = [
      {
        // Casual
        customDifficulty: false,
        goForKill: false,
        microType: 0,
        mandatoryMinions: 0,
        minionMod: 0.24,
        priority_scout_metal_spots: false,
        useEasierSystemTemplate: false,
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
        ffa_chance: 25,
        bossCommanders: 2,
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
        minionMod: 0.28,
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
        ffa_chance: 25,
        bossCommanders: 2,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 25,
        bountyModeValue: 0.4,
        factionTechHandicap: 3,
        starting_location_evaluation_radius: 100,
      },
      {
        // Bronze
        customDifficulty: false,
        goForKill: true,
        microType: 2,
        mandatoryMinions: 0,
        minionMod: 0.33,
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
        ffa_chance: 25,
        bossCommanders: 3,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 20,
        bountyModeValue: 0.3,
        factionTechHandicap: 2,
        starting_location_evaluation_radius: 150,
      },
      {
        // Silver
        customDifficulty: false,
        goForKill: true,
        microType: 2,
        mandatoryMinions: 0,
        minionMod: 0.4,
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
        ffa_chance: 25,
        bossCommanders: 3,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 20,
        bountyModeValue: 0.3,
        factionTechHandicap: 2,
        starting_location_evaluation_radius: 200,
      },
      {
        // Gold
        customDifficulty: false,
        goForKill: true,
        microType: 2,
        mandatoryMinions: 0,
        minionMod: 0.49,
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
        ffa_chance: 25,
        bossCommanders: 4,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 15,
        bountyModeValue: 0.2,
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
        ffa_chance: 25,
        bossCommanders: 4,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 15,
        bountyModeValue: 0.2,
        factionTechHandicap: 1,
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
        ffa_chance: 25,
        bossCommanders: 5,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 10,
        bountyModeValue: 0.1,
        factionTechHandicap: 0,
        starting_location_evaluation_radius: 400,
      },
      {
        // Uber
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
        econBase: 10,
        econRatePerDist: 0,
        max_basic_fabbers: 25,
        max_advanced_fabbers: 25,
        ffa_chance: 25,
        bossCommanders: 5,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 10,
        bountyModeValue: 0.1,
        factionTechHandicap: 0,
        starting_location_evaluation_radius: 400,
      },
      {
        // Custom
        customDifficulty: true,
      },
    ];

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

    model.makeGame = function () {
      model.newGame(undefined);

      if (model.gwaioDifficultySettings.easierStart()) var baseNeutralStars = 4;
      else baseNeutralStars = 2;

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
        return GWDealer.dealCard({
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

        var neutralStars = baseNeutralStars;
        // Over-spread to take up all the neutral stars
        if (model.creditsMode()) neutralStars = 0;

        return GWBreeder.populate({
          galaxy: game.galaxy(),
          teams: teams,
          neutralStars: neutralStars,
          orderedSpawn: model.creditsMode(),
          // eslint-disable-next-line lodash/prefer-noop
          spawn: function () {},
          canSpread: function (_, ai) {
            return (
              !model.creditsMode() || !ai || !!teams[ai.team].workers.length
            );
          },
          spread: function (star, ai) {
            var team = teams[ai.team];
            return GWTeams.makeWorker(star, ai, team).then(function () {
              if (team.workers)
                // eslint-disable-next-line lodash/matches-prop-shorthand
                _.remove(team.workers, function (worker) {
                  return worker.name === ai.name;
                });

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

      var aiInventory = [];
      var bossInventory = [];

      if (model.gwaioDifficultySettings.tougherCommanders()) {
        aiInventory = aiInventory.concat(gwaioTech.tougherCommander[0]);
        bossInventory = bossInventory.concat(gwaioTech.tougherCommander[1]);
      }

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

        var setAIData = function (ai, dist, isBoss) {
          if (ai.personality === undefined) ai.personality = {};
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
          else delete ai.personality.starting_location_evaluation_radius;
          if (isBoss) {
            ai.econ_rate =
              model.gwaioDifficultySettings.econBase() +
              maxDist * model.gwaioDifficultySettings.econRatePerDist();
            ai.bossCommanders = model.gwaioDifficultySettings.bossCommanders();
          } else {
            ai.econ_rate =
              model.gwaioDifficultySettings.econBase() +
              dist * model.gwaioDifficultySettings.econRatePerDist();
          }
        };

        var buffType = [0, 1, 2, 3, 4]; // 0 = cost; 1 = damage; 2 = health; 3 = speed; 4 = build
        var buffDelay = model.gwaioDifficultySettings.factionTechHandicap();

        _.forEach(teamInfo, function (info) {
          if (info.boss) {
            setAIData(info.boss, maxDist, true);
            info.boss.inventory = aiInventory.concat(bossInventory);
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
              _.times(numMinions, function () {
                var bossMinions = _.sample(GWFactions[info.faction].minions);
                setAIData(bossMinions, maxDist, true);
                bossMinions.color = bossMinions.color || info.boss.color;
                info.boss.minions.push(bossMinions);
              });
            }
          }

          _.forEach(info.workers, function (worker) {
            worker.ai.inventory = aiInventory;
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
            var dist = worker.star.distance();
            setAIData(worker.ai, dist, false);
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
              _.times(numMinions, function () {
                var minions = _.sample(GWFactions[info.faction].minions);
                setAIData(minions, dist, false);
                minions.color = minions.color || worker.ai.color;
                worker.ai.minions.push(minions);
              });
            }

            var availableFactions = _.without(aiFactions, worker.ai.faction);
            _.times(availableFactions.length, function () {
              if (
                Math.random() * 100 <=
                model.gwaioDifficultySettings.ffaChance()
              ) {
                if (worker.ai.foes === undefined) worker.ai.foes = [];
                availableFactions = _.shuffle(availableFactions);
                var foeFaction = availableFactions.splice(0, 1);
                var foeCommander = _.sample(GWFactions[foeFaction].minions);
                var numFoes = Math.round((numMinions + 1) / 2);
                setAIData(foeCommander, dist, false);
                foeCommander.inventory = [];
                _.times(typeOfBuffs.length, function (n) {
                  foeCommander.inventory = foeCommander.inventory.concat(
                    gwaioTech.factionTechs[foeFaction][typeOfBuffs[n]]
                  );
                });
                foeCommander.color = foeCommander.color || worker.ai.color;
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
            if (model.gwaioDifficultySettings.mirrorMode())
              ai.mirrorMode = true;
            else ai.mirrorMode = false;
            // eslint-disable-next-line lodash/prefer-filter
            _.forEach(star.system().planets, function (world) {
              if (world.starting_planet === true)
                if (world.planet) {
                  world.planet.shuffleLandingZones = true;
                } else world.generator.shuffleLandingZones = true;
            });
          }
        });

        if (model.creditsMode()) {
          var origin = game.galaxy().stars()[game.galaxy().origin()];
          origin.system().name = GWCredits.startSystem.name;
          origin.system().description = GWCredits.startSystem.description;
        }
      });

      var dealBossCards = finishAis.then(function () {
        return GWDealer.dealBossCards({
          galaxy: game.galaxy(),
          inventory: game.inventory(),
        });
      });

      dealBossCards.then(function () {
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
