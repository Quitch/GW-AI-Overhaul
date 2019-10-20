document.getElementById("game-difficulty").innerHTML = "";
document
  .getElementById("game-difficulty")
  .insertAdjacentHTML(
    "afterbegin",
    '<option value="0">GW-CASUAL</option>' +
      '<option value="1">GW-BRONZE</option>' +
      '<option value="2">GW-SILVER</option>' +
      '<option value="3">GW-GOLD</option>' +
      '<option value="4">GW-PLATINUM</option>' +
      '<option value="5">GW-UBER</option>' +
      '<option value="6">GW-CUSTOM</option>'
  );
document
  .getElementById("game-difficulty-label")
  .insertAdjacentHTML(
    "afterend",
    '<span class="info_tip" data-bind="tooltip: \'!LOC:CASUAL: you completed the tutorial.<br>BRONZE: you have some experience.<br>SILVER: you can beat the top AI skirmish difficulty.<br>GOLD: one enemy is no challenge.<br>PLATINUM: your loadouts are OP.<br>UBER: you hate winning.<br>CUSTOM: create your own challenge. Remembers the settings of the last selected difficulty.\'">?</span>'
  );

var customDifficultySettings = {
  customDifficulty: ko.observable(false),
  goForKill: ko.observable(),
  microType: ko.observableArray(["0", "1", "2"]),
  microTypeDescription: ko.observable({
    "0": "!LOC:None",
    "1": "!LOC:Basic",
    "2": "!LOC:Advanced"
  }),
  chosenMicroType: ko.observable(),
  mandatoryMinions: ko.observable(),
  minionMod: ko.observable(),
  priorityScoutMetalSpots: ko.observable(),
  useEasierSystemTemplate: ko.observable(),
  factoryBuildDelayMin: ko.observable(),
  factoryBuildDelayMax: ko.observable(),
  unableToExpandDelay: ko.observable(),
  enableCommanderDangerResponses: ko.observable(),
  perExpansionDelay: ko.observable(),
  personalityTags: ko.observableArray(["SlowerExpansion", "PreventsWaste"]),
  personalityTagsDescription: ko.observable({
    SlowerExpansion: "!LOC:Slower Expansion",
    PreventsWaste: "!LOC:Prevent Wastage"
  }),
  chosenPersonalityTags: ko.observableArray(["SlowerExpansion"]),
  econBase: ko.observable(),
  econRatePerDist: ko.observable(),
  maxBasicFabbers: ko.observable(),
  maxAdvancedFabbers: ko.observable(),
  ffaChance: ko.observable(),
  unsavedChanges: ko.observable(false)
};
customDifficultySettings.getmicroTypeDescription = function(value) {
  return loc(customDifficultySettings.microTypeDescription()[value]);
};
customDifficultySettings.getpersonalityTagsDescription = function(value) {
  return loc(customDifficultySettings.personalityTagsDescription()[value]);
};

customDifficultySettings.goForKill.subscribe(function() {
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});
customDifficultySettings.chosenMicroType.subscribe(function() {
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});
customDifficultySettings.priorityScoutMetalSpots.subscribe(function() {
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});
customDifficultySettings.useEasierSystemTemplate.subscribe(function() {
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});
customDifficultySettings.enableCommanderDangerResponses.subscribe(function() {
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});
customDifficultySettings.chosenPersonalityTags.subscribe(function() {
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});

customDifficultySettings.mandatoryMinions.subscribe(function(value) {
  customDifficultySettings.mandatoryMinions(
    Math.max(0, Number(Number(value).toFixed(0)))
  );
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});
customDifficultySettings.minionMod.subscribe(function(value) {
  customDifficultySettings.minionMod(
    Math.max(0, Number(Number(value).toFixed(2)))
  );
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});
customDifficultySettings.factoryBuildDelayMin.subscribe(function(value) {
  customDifficultySettings.factoryBuildDelayMin(
    Math.max(0, Number(Number(value).toFixed(0)))
  );
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});
customDifficultySettings.factoryBuildDelayMax.subscribe(function(value) {
  customDifficultySettings.factoryBuildDelayMax(
    Math.max(0, Number(Number(value).toFixed(0)))
  );
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});
customDifficultySettings.unableToExpandDelay.subscribe(function(value) {
  customDifficultySettings.unableToExpandDelay(
    Math.max(0, Number(Number(value).toFixed(0)))
  );
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});
customDifficultySettings.perExpansionDelay.subscribe(function(value) {
  customDifficultySettings.perExpansionDelay(
    Math.max(0, Number(Number(value).toFixed(0)))
  );
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});
customDifficultySettings.econBase.subscribe(function(value) {
  customDifficultySettings.econBase(
    Math.max(0, Number(Number(value).toFixed(2)))
  );
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});
customDifficultySettings.econRatePerDist.subscribe(function(value) {
  customDifficultySettings.econRatePerDist(
    Math.max(0, Number(Number(value).toFixed(3)))
  );
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});
customDifficultySettings.maxBasicFabbers.subscribe(function(value) {
  customDifficultySettings.maxBasicFabbers(
    Math.max(0, Number(Number(value).toFixed(0)))
  );
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});
customDifficultySettings.maxAdvancedFabbers.subscribe(function(value) {
  customDifficultySettings.maxAdvancedFabbers(
    Math.max(0, Number(Number(value).toFixed(0)))
  );
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});
customDifficultySettings.ffaChance.subscribe(function(value) {
  customDifficultySettings.ffaChance(
    Math.max(0, Number(Number(value).toFixed(0)))
  );
  if (customDifficultySettings.customDifficulty())
    customDifficultySettings.unsavedChanges(true);
});

document
  .getElementById("game-difficulty")
  .insertAdjacentHTML(
    "afterend",
    '<div class="sub_options" id="custom-difficulty-settings" data-bind="visible: customDifficultySettings.customDifficulty()">' +
      '<div class="form-group">' +
      '<div><input type="checkbox", data-bind="checked: customDifficultySettings.goForKill" />' +
      '<span style="margin-left: 6px;"></span><loc>Target Weakest</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Focus on weakest enemy.\'">?</span></div>' +
      '<div><input type="checkbox", data-bind="checked: customDifficultySettings.priorityScoutMetalSpots" />' +
      '<span style="margin-left: 6px;"></span><loc>Scout Metal First</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Scout around metal spots rather than at random.\'">?</span></div>' +
      '<div><input type="checkbox", data-bind="checked: customDifficultySettings.useEasierSystemTemplate" />' +
      '<span style="margin-left: 6px;"></span><loc>Easy Systems</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Greater number of single planet systems. Does not affect bosses.\'">?</span></div>' +
      '<div><input type="checkbox", data-bind="checked: customDifficultySettings.enableCommanderDangerResponses" />' +
      '<span style="margin-left: 6px;"></span><loc>Commander Leaves Planet</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Allow Commanders to travel by orbital transport and teleporter.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: customDifficultySettings.mandatoryMinions" />' +
      '<span style="margin-left: 6px;"></span><loc>Mandatory Minions</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Number of additional Commanders in every system.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: customDifficultySettings.minionMod" />' +
      '<span style="margin-left: 6px;"></span><loc>Minion Modifer</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Mandatory Minions + Star Distance * Minion Modifier = number of additional enemy Commanders.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: customDifficultySettings.factoryBuildDelayMin" />' +
      '<span style="margin-left: 6px;"></span><loc>Unit Production Delay (min)</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Minimum number of seconds between units produced from a factory.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: customDifficultySettings.factoryBuildDelayMax" />' +
      '<span style="margin-left: 6px;"></span><loc>Unit Production Delay (max)</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Maximum number of seconds between units produced from a factory.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: customDifficultySettings.unableToExpandDelay" />' +
      '<span style="margin-left: 6px;"></span><loc>Unable To Expand Delay</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Additional amount of time in seconds before recognising that it is contained.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: customDifficultySettings.perExpansionDelay" />' +
      '<span style="margin-left: 6px;"></span><loc>Per Expansion Delay</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Delay in seconds between the creation of new bases.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: customDifficultySettings.econBase" />' +
      '<span style="margin-left: 6px;"></span><loc>Base Econ Modifier</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage modifier to all sources of income where 1 = 100%.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: customDifficultySettings.econRatePerDist" />' +
      '<span style="margin-left: 6px;"></span><loc>Distance Econ Modifier</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage points added to the Base Econ Modifer for each hop the enemey is from the starting star.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: customDifficultySettings.maxBasicFabbers" />' +
      '<span style="margin-left: 6px;"></span><loc>Max Basic Fabbers</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:The most basic fabbers each enemy army will build.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: customDifficultySettings.maxAdvancedFabbers" />' +
      '<span style="margin-left: 6px;"></span><loc>Max Advanced Fabbers</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:The most advanced fabbers each enemy army will build.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: customDifficultySettings.ffaChance" />' +
      '<span style="margin-left: 6px;"></span><loc>FFA Chance</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage chance per star of a FFA occuring.\'">?</span></div>' +
      '<div><select data-bind="options: customDifficultySettings.microType, optionsText: customDifficultySettings.getmicroTypeDescription, value:customDifficultySettings.chosenMicroType"></select>' +
      '<span style="margin-left: 6px;"></span><loc>Micro</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:How well the AI handles its armies in combat.\'">?</span></div>' +
      '<div><select data-bind="options: customDifficultySettings.personalityTags, optionsText: customDifficultySettings.getpersonalityTagsDescription, selectedOptions: customDifficultySettings.chosenPersonalityTags", multiple="true"></select>' +
      '<span style="margin-left: 6px;"></span><loc>Aditional Settings</loc></label>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Slower Expansion = takes longer to grow its presence and economy.<br>Prevent Wastage = turns excess eco into more factories.<br>Use Ctrl to select multiple options and deselect currently selected options.\'">?</span></div>' +
      "<div class='btn_hero' data-bind=\"click: model.makeGame(), click_sound: 'default', rollover_sound: 'default', css: { btn_hero_disabled: !customDifficultySettings.unsavedChanges() }\">" +
      '<div class="btn_label" style="width:175px;"><loc>Save</loc></div></div>' +
      "</div></div>"
  );

requireGW(
  [
    "shared/gw_common",
    "shared/gw_credits",
    "shared/gw_factions",
    "pages/gw_start/gw_breeder",
    "pages/gw_start/gw_dealer",
    "pages/gw_start/gw_teams",
    "main/shared/js/star_system_templates",
    "main/game/galactic_war/shared/js/gw_easy_star_systems"
  ],
  function(
    GW,
    GWCredits,
    GWFactions,
    GWBreeder,
    GWDealer,
    GWTeams,
    normal_system_templates /* this actually won't load -- window.star_system_templates is set instead */,
    easy_system_templates
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
        personality_tags: ["SlowerExpansion"],
        econBase: 0.4,
        econRatePerDist: 0.05,
        max_basic_fabbers: 10,
        max_advanced_fabbers: 10,
        ffa_chance: 25
      },
      {
        // Bronze
        customDifficulty: false,
        goForKill: false,
        microType: 1,
        mandatoryMinions: 0,
        minionMod: 0.3,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags: ["SlowerExpansion"],
        econBase: 0.55,
        econRatePerDist: 0.075,
        max_basic_fabbers: 15,
        max_advanced_fabbers: 15,
        ffa_chance: 25
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
        econBase: 0.7,
        econRatePerDist: 0.1,
        max_basic_fabbers: 20,
        max_advanced_fabbers: 20,
        ffa_chance: 25
      },
      {
        // Gold
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
        personality_tags: ["PreventsWaste"],
        econBase: 0.85,
        econRatePerDist: 0.15,
        max_basic_fabbers: 25,
        max_advanced_fabbers: 25,
        ffa_chance: 25
      },
      {
        // Platinum
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
        personality_tags: ["PreventsWaste"],
        econBase: 1,
        econRatePerDist: 0.2,
        max_basic_fabbers: 30,
        max_advanced_fabbers: 30,
        ffa_chance: 25
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
        personality_tags: ["PreventsWaste"],
        econBase: 10,
        econRatePerDist: 0,
        max_basic_fabbers: 35,
        max_advanced_fabbers: 35,
        ffa_chance: 25
      },
      {
        // Custom
        customDifficulty: true
      }
    ];

    var baseNeutralStars = 2;

    model.makeGame = function() {
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

      // Track the previously selected difficulty values
      if (
        !difficultyInfo[model.newGameDifficultyIndex() || 0].customDifficulty
      ) {
        customDifficultySettings.goForKill(
          difficultyInfo[model.newGameDifficultyIndex() || 0].goForKill
        );
        customDifficultySettings.chosenMicroType(
          difficultyInfo[model.newGameDifficultyIndex() || 0].microType
        );
        customDifficultySettings.mandatoryMinions(
          difficultyInfo[model.newGameDifficultyIndex() || 0].mandatoryMinions
        );
        customDifficultySettings.minionMod(
          difficultyInfo[model.newGameDifficultyIndex() || 0].minionMod
        );
        customDifficultySettings.priorityScoutMetalSpots(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .priority_scout_metal_spots
        );
        customDifficultySettings.useEasierSystemTemplate(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .useEasierSystemTemplate
        );
        customDifficultySettings.factoryBuildDelayMin(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .factory_build_delay_min
        );
        customDifficultySettings.factoryBuildDelayMax(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .factory_build_delay_max
        );
        customDifficultySettings.unableToExpandDelay(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .unable_to_expand_delay
        );
        customDifficultySettings.enableCommanderDangerResponses(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .enable_commander_danger_responses
        );
        customDifficultySettings.perExpansionDelay(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .per_expansion_delay
        );
        customDifficultySettings.chosenPersonalityTags(
          difficultyInfo[model.newGameDifficultyIndex() || 0].personality_tags
        );
        customDifficultySettings.econBase(
          difficultyInfo[model.newGameDifficultyIndex() || 0].econBase
        );
        customDifficultySettings.econRatePerDist(
          difficultyInfo[model.newGameDifficultyIndex() || 0].econRatePerDist
        );
        customDifficultySettings.maxBasicFabbers(
          difficultyInfo[model.newGameDifficultyIndex() || 0].max_basic_fabbers
        );
        customDifficultySettings.maxAdvancedFabbers(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .max_advanced_fabbers
        );
        customDifficultySettings.ffaChance(
          difficultyInfo[model.newGameDifficultyIndex() || 0].ffa_chance
        );
      }
      // Only show the custom fields if custom difficulty is selected
      if (
        difficultyInfo[model.newGameDifficultyIndex() || 0].customDifficulty
      ) {
        customDifficultySettings.customDifficulty(true);
      } else {
        customDifficultySettings.customDifficulty(false);
      }

      if (model.creditsMode()) {
        size = _.reduce(
          GWFactions,
          function(factionSum, faction) {
            return _.reduce(
              faction.teams,
              function(teamSum, team) {
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
        minimumDistanceBonus: 8
      });
      var dealStartCard = buildGalaxy.then(function(galaxy) {
        if (model.makeGameBusy() !== busyToken) return;
        return GWDealer.dealCard({
          id: model.activeStartCard().id(),
          inventory: game.inventory(),
          galaxy: galaxy,
          star: galaxy.stars()[galaxy.origin()]
        }).then(function(startCardProduct) {
          game
            .inventory()
            .cards.push(
              startCardProduct || { id: model.activeStartCard().id() }
            );
        });
      });
      var moveIn = dealStartCard.then(function() {
        if (model.makeGameBusy() !== busyToken) return;
        game.move(game.galaxy().origin());

        var star = game.galaxy().stars()[game.currentStar()];
        star.explored(true);

        game.gameState(GW.Game.gameStates.active);
      });
      var populate = moveIn.then(function() {
        if (model.makeGameBusy() !== busyToken) return;

        // Scatter some AIs
        var aiFactions = _.range(GWFactions.length);
        aiFactions.splice(model.playerFactionIndex(), 1);
        if (!model.creditsMode()) aiFactions = _.shuffle(aiFactions);
        var teams = _.map(aiFactions, GWTeams.getTeam);
        if (model.creditsMode()) {
          // Duplicate the workers so we can keep them unique
          _.forEach(teams, function(team) {
            team.workers = (team.workers || []).slice(0);
          });
        }

        var teamInfo = _.map(teams, function(team, teamIndex) {
          return {
            team: team,
            workers: [],
            faction: aiFactions[teamIndex]
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
          spawn: _.noop(),
          canSpread: function(star, ai) {
            return (
              !model.creditsMode() || !ai || !!teams[ai.team].workers.length
            );
          },
          spread: function(star, ai) {
            var team = teams[ai.team];
            return GWTeams.makeWorker(star, ai, team).then(function() {
              if (team.workers)
                _.remove(team.workers, function(worker) {
                  return worker.name === ai.name;
                });

              ai.faction = teamInfo[ai.team].faction;
              teamInfo[ai.team].workers.push({
                ai: ai,
                star: star
              });
            });
          },
          boss: function(star, ai) {
            return GWTeams.makeBoss(
              star,
              ai,
              teams[ai.team],
              systemTemplates
            ).then(function() {
              ai.faction = teamInfo[ai.team].faction;
              teamInfo[ai.team].boss = ai;
            });
          },
          breedToOrigin: game.isTutorial()
        }).then(function() {
          return teamInfo;
        });
      });

      var finishAis = populate.then(function(teamInfo) {
        if (model.makeGameBusy() !== busyToken) return;

        // DIFFICULTY RAMPING CODE
        var maxDist = _.reduce(
          game.galaxy().stars(),
          function(value, star) {
            return Math.max(star.distance(), value);
          },
          0
        );
        //console.log("Max Distance: " + maxDist);

        var setAIData = function(ai, dist, isBoss) {
          if (ai.personality === undefined) ai.personality = {};
          ai.personality.micro_type = customDifficultySettings.chosenMicroType();
          ai.personality.go_for_the_kill = customDifficultySettings.goForKill();
          ai.personality.priorityscoutmetalspots = customDifficultySettings.priorityScoutMetalSpots();
          ai.personality.factory_build_delay_min = customDifficultySettings.factoryBuildDelayMin();
          ai.personality.factory_build_delay_max = customDifficultySettings.factoryBuildDelayMax();
          ai.personality.unable_to_expand_delay = customDifficultySettings.unableToExpandDelay();
          ai.personality.enable_commander_danger_responses = customDifficultySettings.enableCommanderDangerResponses();
          ai.personality.per_expansion_delay = customDifficultySettings.perExpansionDelay();
          ai.personality.max_basic_fabbers = customDifficultySettings.maxBasicFabbers();
          ai.personality.max_advanced_fabbers = customDifficultySettings.maxAdvancedFabbers();
          ai.personality.personality_tags = customDifficultySettings.chosenPersonalityTags();
          if (isBoss) {
            ai.econ_rate =
              customDifficultySettings.econBase() +
              maxDist * customDifficultySettings.econRatePerDist();
          } else {
            ai.econ_rate =
              customDifficultySettings.econBase() +
              dist * customDifficultySettings.econRatePerDist();
          }
        };

        var aiFactions = _.range(GWFactions.length);
        aiFactions.splice(model.playerFactionIndex(), 1);
        var sizeMod =
          GW.balance.galaxySizeDiffMod[model.newGameSizeIndex() || 0];

        _.forEach(teamInfo, function(info) {
          if (info.boss) {
            setAIData(info.boss, maxDist, true);
            var numMinions = Math.floor(
              customDifficultySettings.mandatoryMinions() +
                maxDist * customDifficultySettings.minionMod()
            );
            //console.log("BOSS | Distance: " + maxDist + " | Econ Rate: " + info.boss.econ_rate + " | Minion Count: " + numMinions);
            if (numMinions > 0) {
              info.boss.minions = [];
              _.times(numMinions, function() {
                var bossMinions = _.sample(GWFactions[info.faction].minions);
                setAIData(bossMinions, maxDist, true);
                bossMinions.color = bossMinions.color || info.boss.color;
                info.boss.minions.push(bossMinions);
              });
            }
          }
          _.forEach(info.workers, function(worker) {
            var dist = worker.star.distance();
            setAIData(worker.ai, dist, false);
            var numMinions = Math.floor(
              customDifficultySettings.mandatoryMinions() +
                worker.star.distance() * customDifficultySettings.minionMod()
            );
            if (numMinions > 0) {
              worker.ai.minions = [];
              _.times(numMinions, function() {
                var minions = _.sample(GWFactions[info.faction].minions);
                setAIData(minions, dist, false);
                minions.color = minions.color || worker.ai.color;
                worker.ai.minions.push(minions);
              });
            }
            if (
              Math.random() * 100 <=
              customDifficultySettings.ffaChance() * sizeMod
            ) {
              var hostileFactions = _.sample(
                _.without(aiFactions, worker.ai.faction)
              );
              worker.ai.foes = [];
              var ffaFirstFaction = _.sample(
                GWFactions[hostileFactions].minions
              );
              setAIData(ffaFirstFaction, dist, false);
              var numFoes = Math.round((numMinions + 1) / 2);
              ffaFirstFaction.color = ffaFirstFaction.color || worker.ai.color;
              var landingPolicyFoes = [];
              _.times(numFoes, function() {
                landingPolicyFoes.push("no_restriction");
              });
              ffaFirstFaction.landing_policy = landingPolicyFoes;
              worker.ai.foes.push(ffaFirstFaction);
              if (
                Math.random() * 100 <=
                customDifficultySettings.ffaChance() * sizeMod
              ) {
                var hostileFactionsRemaining = _.sample(
                  _.without(aiFactions, worker.ai.faction, hostileFactions)
                );
                var ffaSecondFaction = _.sample(
                  GWFactions[hostileFactionsRemaining].minions
                );
                setAIData(ffaSecondFaction, dist, false);
                ffaSecondFaction.color =
                  ffaSecondFaction.color || worker.ai.color;
                ffaSecondFaction.landing_policy = landingPolicyFoes;
                worker.ai.foes.push(ffaSecondFaction);
              }
            }
            //console.log("Distance:", dist, "| Econ Rate:", worker.ai.econ_rate, "| Minion Count:", numMinions, "| Foe Commanders:", numFoes, "| Third Faction", hostileFactionsRemaining);
          });
        });

        var gw_intro_systems = [
          {
            name: "!LOC:The Progenitors",
            description:
              "!LOC:What little is clear is that the galaxy was once inhabited by a sprawling empire, seemingly destroyed by conflict. The commanders refer to these beings as The Progenitors. Many commanders believe answers to their origins lie within the ruins of this once great civilization."
          },
          {
            name: "!LOC:Galactic War",
            description:
              "!LOC:Some commanders fight because it's all they know, while others seek answers to their origins. Conflicts in motivation and creed drive the commanders into a war that is poised to ravage the galaxy for centuries."
          },
          {
            name: "!LOC:The Commanders",
            description:
              "!LOC:The commanders have slumbered for millions of years, and awaken to a galaxy that contains only echoes of civilization. These ancient war machines now battle across the galaxy, following the only directives they still hold from long ago."
          }
        ];

        var n = 0;
        _.forEach(game.galaxy().stars(), function(star) {
          var ai = star.ai();
          if (!ai) {
            var intro_system = gw_intro_systems[n];
            if (intro_system) {
              star.system().name = intro_system.name;
              star.system().description = intro_system.description;
              n = n + 1;
            }
          } else {
            star.system().display_name =
              ai.name; /* display name overrides name even after the ai dies */
            star.system().description = ai.description;
          }
        });

        if (model.creditsMode()) {
          var origin = game.galaxy().stars()[game.galaxy().origin()];
          origin.system().name = GWCredits.startSystem.name;
          origin.system().description = GWCredits.startSystem.description;
        }
      });

      var dealBossCards = finishAis.then(function() {
        return GWDealer.dealBossCards({
          galaxy: game.galaxy(),
          inventory: game.inventory()
        });
      });

      dealBossCards.then(function() {
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
