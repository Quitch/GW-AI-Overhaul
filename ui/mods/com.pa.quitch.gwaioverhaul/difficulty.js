// Remove the vanilla difficulties
$("#game-difficulty").empty()

// Add new difficulty levels
$('#game-difficulty').append('<option value="0">CASUAL</option>' +
  '<option value="1">BRONZE</option>' +
  '<option value="2">SILVER</option>' +
  '<option value="3">GOLD</option>' +
  '<option value="4">PLATINUM</option>' +
  '<option value="5">UBER</option>')

// Setup and load new difficulties
requireGW([
  'shared/gw_common',
  'shared/gw_credits',
  'shared/gw_factions',
  'pages/gw_start/gw_breeder',
  'pages/gw_start/gw_dealer',
  'pages/gw_start/gw_teams',
  'main/shared/js/star_system_templates',
  'main/game/galactic_war/shared/js/gw_easy_star_systems'
], function (
  GW,
  GWCredits,
  GWFactions,
  GWBreeder,
  GWDealer,
  GWTeams,
  normal_system_templates, /* this actually won't load -- window.star_system_templates is set instead */
  easy_system_templates
) {

    // Setup new difficulties
    var difficultyInfo = [
      {
        // Casual
        goForKill: false,
        microType: 0,
        mandatoryMinions: 0,
        minionMod: 0.3,
        priority_scout_metal_spots: false,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 12,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: false,
        per_expansion_delay: 0,
        personality_tags:
          [
            "SlowerExpansion"
          ],
        econBase: 0.5,
        econRatePerDist: 0.05,
        max_basic_fabbers: 10,
        max_advanced_fabbers: 10,
        ffa_chance: 5
      },
      {
        // Bronze
        goForKill: false,
        microType: 1,
        mandatoryMinions: 0,
        minionMod: 0.35,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 6,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        econBase: 0.7,
        econRatePerDist: 0.05,
        max_basic_fabbers: 20,
        max_advanced_fabbers: 20,
        ffa_chance: 15
      },
      {
        // Silver
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
        personality_tags:
          [
            "PreventsWaste"
          ],
        econBase: 0.7,
        econRatePerDist: 0.1,
        max_basic_fabbers: 30,
        max_advanced_fabbers: 30,
        ffa_chance: 15
      },
      {
        // Gold
        goForKill: true,
        microType: 2,
        mandatoryMinions: 0,
        minionMod: 0.7,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags:
          [
            "PreventsWaste"
          ],
        econBase: 0.8,
        econRatePerDist: 0.15,
        max_basic_fabbers: 40,
        max_advanced_fabbers: 40,
        ffa_chance: 15
      },
      {
        // Platinum
        goForKill: true,
        microType: 2,
        mandatoryMinions: 1,
        minionMod: 0.7,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags:
          [
            "PreventsWaste"
          ],
        econBase: 0.8,
        econRatePerDist: 0.2,
        max_basic_fabbers: 50,
        max_advanced_fabbers: 50,
        ffa_chance: 15
      },
      {
        // Uber
        goForKill: true,
        microType: 2,
        mandatoryMinions: 0,
        minionMod: 0.7,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags:
          [
            "PreventsWaste"
          ],
        econBase: 10,
        econRatePerDist: 0,
        max_basic_fabbers: 100,
        max_advanced_fabbers: 100,
        ffa_chance: 15
      }
    ]

    /*
    Modify the makeGame function from gw_start.js with thanks to Wondible
    Replace GW.balance.difficultyInfo with difficultyInfo
    Limit data passed to SetAIData
    Minions use minion colour not worker colour
    Add Foes which represent a second faction contesting the system
    */

    var baseNeutralStars = 2;

    model.makeGame = function () {
      model.newGame(undefined);

      var busyToken = {};
      model.makeGameBusy(busyToken);

      var game = new GW.Game();

      game.name(model.newGameName());
      game.mode(model.mode());
      game.hardcore(model.newGameHardcore());
      game.content(api.content.activeContent());

      var useEasySystems = difficultyInfo[model.newGameDifficultyIndex() || 0].useEasierSystemTemplate;
      var systemTemplates = useEasySystems ? easy_system_templates : star_system_templates;
      var sizes = GW.balance.numberOfSystems;
      var size = sizes[model.newGameSizeIndex()] || 40;

      if (model.creditsMode()) {
        size = _.reduce(GWFactions, function (factionSum, faction) {
          return _.reduce(faction.teams, function (teamSum, team) {
            return teamSum + (team.workers || []).length;
          }, factionSum + 1);
        }, 0);
      }

      model.updateCommander();
      game.inventory().setTag('global', 'playerFaction', model.playerFactionIndex());
      game.inventory().setTag('global', 'playerColor', model.playerColor());

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
      var dealStartCard = buildGalaxy.then(function (galaxy) {
        if (model.makeGameBusy() !== busyToken)
          return;
        return GWDealer.dealCard({
          id: model.activeStartCard().id(),
          inventory: game.inventory(),
          galaxy: galaxy,
          star: galaxy.stars()[galaxy.origin()]
        }).then(function (startCardProduct) {
          game.inventory().cards.push(startCardProduct || { id: model.activeStartCard().id() });
        });
      });
      var moveIn = dealStartCard.then(function () {
        if (model.makeGameBusy() !== busyToken)
          return;
        game.move(game.galaxy().origin());

        var star = game.galaxy().stars()[game.currentStar()];
        star.explored(true);

        game.gameState(GW.Game.gameStates.active);
      });
      var populate = moveIn.then(function () {
        if (model.makeGameBusy() !== busyToken)
          return;

        // Scatter some AIs
        var aiFactions = _.range(GWFactions.length);
        aiFactions.splice(model.playerFactionIndex(), 1);
        if (!model.creditsMode())
          aiFactions = _.shuffle(aiFactions);
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
            faction: aiFactions[teamIndex]
          };
        });

        var neutralStars = baseNeutralStars;
        // Over-spread to take up all the neutral stars
        if (model.creditsMode())
          neutralStars = 0;

        return GWBreeder.populate({
          galaxy: game.galaxy(),
          teams: teams,
          neutralStars: neutralStars,
          orderedSpawn: model.creditsMode(),
          spawn: function (star, ai) {
          },
          canSpread: function (star, ai) {
            return !model.creditsMode() || !ai || !!teams[ai.team].workers.length;
          },
          spread: function (star, ai) {
            var team = teams[ai.team];
            return GWTeams.makeWorker(star, ai, team).then(function () {
              if (team.workers)
                _.remove(team.workers, function (worker) { return worker.name === ai.name; });

              ai.faction = teamInfo[ai.team].faction;
              teamInfo[ai.team].workers.push({
                ai: ai,
                star: star
              });
            });
          },
          boss: function (star, ai) {
            return GWTeams.makeBoss(star, ai, teams[ai.team], systemTemplates).then(function () {
              ai.faction = teamInfo[ai.team].faction;
              teamInfo[ai.team].boss = ai;
            });
          },
          breedToOrigin: game.isTutorial()
        }).then(function () {
          return teamInfo;
        });
      });

      var finishAis = populate.then(function (teamInfo) {
        if (model.makeGameBusy() !== busyToken)
          return;

        // DIFFICULTY RAMPING CODE
        //console.log(" START DIFFICULTY RAMPING ");
        var maxDist = _.reduce(game.galaxy().stars(), function (value, star) {
          return Math.max(star.distance(), value);
        }, 0);
        var diffInfo = difficultyInfo[game.galaxy().difficultyIndex];

        var setAIData = function (ai, dist, isBoss) {
          if (ai.personality === undefined) ai.personality = {};
          ai.personality.neural_data_mod = diffInfo.neuralDataMod;
          ai.personality.micro_type = diffInfo.microType;
          ai.personality.go_for_the_kill = diffInfo.goForKill;
          ai.personality.priority_scout_metal_spots = diffInfo.priority_scout_metal_spots;
          ai.personality.factory_build_delay_min = diffInfo.factory_build_delay_min;
          ai.personality.factory_build_delay_max = diffInfo.factory_build_delay_max;
          ai.personality.unable_to_expand_delay = diffInfo.unable_to_expand_delay;
          ai.personality.enable_commander_danger_responses = diffInfo.enable_commander_danger_responses;
          ai.personality.per_expansion_delay = diffInfo.per_expansion_delay;
          ai.personality.max_basic_fabbers = diffInfo.max_basic_fabbers;
          ai.personality.max_advanced_fabbers = diffInfo.max_advanced_fabbers;
          ai.personality.personality_tags = diffInfo.personality_tags
          if (!isBoss) {
            ai.econ_rate = diffInfo.econBase + (dist * diffInfo.econRatePerDist);
          }
          else {
            ai.econ_rate = (diffInfo.econBase + (dist * diffInfo.econRatePerDist)) * ai.econ_rate;
          }

          //console.log("AI DIFF END: ");
        };

        var aiFactions = _.range(GWFactions.length);
        aiFactions.splice(model.playerFactionIndex(), 1);
        var sizeMod = GW.balance.galaxySizeDiffMod[model.newGameSizeIndex() || 0];

        _.forEach(teamInfo, function (info) {
          if (info.boss) {
            setAIData(info.boss, maxDist, true);
            if (info.boss.minions) {
              _.forEach(info.boss.minions, function (minion) {
                setAIData(minion, maxDist, true);
              });
            }
          }
          _.forEach(info.workers, function (worker) {
            var dist = worker.star.distance();
            setAIData(worker.ai, dist, false);
            var numMinions = Math.floor(diffInfo.mandatoryMinions + (worker.star.distance() * diffInfo.minionMod));
            if (numMinions > 0) {
              worker.ai.minions = [];
              _.times(numMinions, function () {
                var mnn = _.sample(GWFactions[info.faction].minions);
                setAIData(mnn, dist, false);
                // Assign each minion its own colour
                mnn.color = mnn.color || worker.ai.color;
                worker.ai.minions.push(mnn);
              });
            }
            // Assign foes
            if (Math.random() * 100 <= diffInfo.ffa_chance * sizeMod) {
              var hostileFactions = _.sample(_.without(aiFactions, worker.ai.faction));
              worker.ai.foes = [];
              var fnn = _.sample(GWFactions[hostileFactions].minions);
              setAIData(fnn, dist, false);
              fnn.color = fnn.color || worker.ai.color;
              worker.ai.foes.push(fnn);
            }
          });
        });

        var gw_intro_systems = [
          {
            name: "!LOC:The Progenitors",
            description: "!LOC:What little is clear is that the galaxy was once inhabited by a sprawling empire, seemingly destroyed by conflict. The commanders refer to these beings as The Progenitors. Many commanders believe answers to their origins lie within the ruins of this once great civilization."
          },
          {
            name: "!LOC:Galactic War",
            description: "!LOC:Some commanders fight because it's all they know, while others seek answers to their origins. Conflicts in motivation and creed drive the commanders into a war that is poised to ravage the galaxy for centuries."
          },
          {
            name: "!LOC:The Commanders",
            description: "!LOC:The commanders have slumbered for millions of years, and awaken to a galaxy that contains only echoes of civilization. These ancient war machines now battle across the galaxy, following the only directives they still hold from long ago."
          }
        ];

        var n = 0;
        _.forEach(game.galaxy().stars(), function (star) {
          var ai = star.ai();
          if (!ai) {
            var intro_system = gw_intro_systems[n];
            if (intro_system) {
              star.system().name = intro_system.name;
              star.system().description = intro_system.description;
              n = n + 1;
            }
          } else {
            star.system().display_name = ai.name; /* display name overrides name even after the ai dies */
            star.system().description = ai.description;
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
          inventory: game.inventory()
        });
      });

      var deal = dealBossCards.then(function () {
        if (model.makeGameBusy() !== busyToken)
          return;

        model.makeGameBusy(false);
        model.newGame(game);
        model.updateCommander();
        return game;
      });
    }

    model.makeGameOrRunCredits();
  })
