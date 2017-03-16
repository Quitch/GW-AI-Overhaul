var model;
var handlers;

requireGW([
    'require',
    'shared/gw_common',
    'shared/gw_game',
    'shared/gw_credits',
    'shared/gw_factions',
    'shared/gw_factions_credits',
    'pages/gw_start/gw_breeder',
    'pages/gw_start/gw_dealer',
    'pages/gw_start/gw_teams',
    'main/shared/js/star_system_templates',
    'main/game/galactic_war/shared/js/gw_easy_star_systems'
], function (
    require,
    GW,
    GWGame,
    GWCredits,
    GWFactions,
    GWFactionsCredits,
    GWBreeder,
    GWDealer,
    GWTeams,
    normal_system_templates, /* this actually won't load -- window.star_system_templates is set instead */
    easy_system_templates
) {

        // TODO: It would be nice if this was shared with the server's color table
        var colorTable = [
            [[210, 50, 44], [51, 151, 197]],
            [[206, 51, 122], [51, 151, 197]],
            [[113, 52, 165], [219, 217, 37]],
            [[59, 54, 182], [219, 217, 37]],
            [[51, 151, 197], [219, 217, 37]],
            [[83, 119, 48], [206, 51, 122]],
            [[219, 217, 37], [113, 52, 165]],
            [[142, 107, 68], [59, 54, 182]],
            [[255, 144, 47], [59, 54, 182]],
            [[200, 200, 200], [210, 50, 44]]
        ];

        // These are the start cards.
        var startCards = [
            { id: 'gwc_start_vehicle' },
            { id: 'gwc_start_air' },
            { id: 'gwc_start_orbital' },
            { id: 'gwc_start_bot' },
            { id: 'gwc_start_artillery' },
            { id: 'gwc_start_subcdr' },
            { id: 'gwc_start_combatcdr' },
            { id: 'gwc_start_allfactory' }
        ];

        var baseNeutralStars = 2;

        $(document).ready(function () {
            // Needed to reset the music when returning to this screen from the play screen


            function UnknownCardViewModel(cardData) {
                var self = this;

                self.id = ko.computed(function () { });
                self.icon = ko.observable();
                self.description = ko.observable('');
                self.activate = function () { };
                self.active = ko.observable(false)
                self.btnClass = ko.observable('btn_std');

                var actualCard = new CardViewModel(cardData);
                actualCard.card.then(function (card) {
                    if (!card.hint)
                        return;
                    var hint = card.hint(cardData);
                    self.icon(hint.icon);
                    self.description(hint.description || '');
                });
            }

            function GameViewModel() {
                var self = this;

                // Get session information about the user, his game, environment, and so on
                self.uberId = ko.observable().extend({ session: 'uberId' });
                self.signedInToUbernet = ko.observable().extend({ session: 'signed_in_to_ubernet' });
                self.transitPrimaryMessage = ko.observable().extend({ session: 'transit_primary_message' });
                self.transitSecondaryMessage = ko.observable().extend({ session: 'transit_secondary_message' });
                self.transitDestination = ko.observable().extend({ session: 'transit_destination' });
                self.transitDelay = ko.observable().extend({ session: 'transit_delay' });

                self.mode = ko.observable($.url().param('mode') || '');
                self.devMode = ko.observable().extend({ session: 'dev_mode' });
                self.creditsMode = ko.computed(function () {
                    return self.mode() === 'credits';
                });

                self.title = ko.computed(function () {
                    return self.mode() || 'Galactic War';
                });

                self.activeGameId = ko.observable().extend({ local: 'gw_active_game' });

                // Tracked for knowing where we've been for pages that can be accessed in more than one way
                self.lastSceneUrl = ko.observable().extend({ session: 'last_scene_url' });

                self.back = function () {
                    window.location.href = 'coui://ui/main/game/start/start.html';
                };
                self.navToLoadSavedGame = function () {
                    model.lastSceneUrl('coui://ui/main/game/galactic_war/gw_start/gw_start.html');
                    window.location.href = 'coui://ui/main/game/save_game_browser/save_game_browser.html';
                }
                self.navToArchive = function () {
                    model.lastSceneUrl('coui://ui/main/game/galactic_war/gw_start/gw_start.html');
                    window.location.href = 'coui://ui/main/game/galactic_war/gw_start/gw_archive.html';
                };

                self.navToGame = function () {
                    self.navToNewGame();
                }
                self.navToNewGame = function () {
                    if (!self.ready())
                        return;

                    var save = GW.manifest.saveGame(self.newGame());
                    self.activeGameId(self.newGame().id);
                    save.then(function () {
                        model.lastSceneUrl('coui://ui/main/game/galactic_war/gw_start/gw_start.html');
                        window.location.href = 'coui://ui/main/game/galactic_war/gw_play/gw_play.html';
                    });
                }

                self.commanders = ko.observableArray();
                self.backupCommander = '/pa/units/commanders/raptor_centurion/raptor_centurion.json';
                var preferredCommander = ko.observable().extend({ local: 'preferredCommander_v2' });
                var selectedCommanderIndex = ko.observable(-1);
                self.selectedCommander = ko.computed(function () {
                    var index = selectedCommanderIndex()
                    if (index >= self.commanders().length || index < 0)
                        return self.backupCommander;

                    return self.commanders()[index];
                });

                self.selectedCommander.subscribe(function () {
                    self.updateCommander();
                });

                self.nextCommander = function () {
                    selectedCommanderIndex(selectedCommanderIndex() == self.commanders().length - 1 ? 0 : selectedCommanderIndex() + 1);
                }
                self.prevCommander = function () {
                    selectedCommanderIndex(selectedCommanderIndex() == 0 ? self.commanders().length - 1 : selectedCommanderIndex() - 1);
                }

                CommanderUtility.afterCommandersLoaded(function () {
                    self.commanders(_.filter(CommanderUtility.getKnownCommanders(), function (commander) {
                        return PlayFab.isCommanderOwned(CommanderUtility.bySpec.getObjectName(commander));
                    }));

                    var commanderIndex = Math.floor(Math.random() * self.commanders().length);

                    if (preferredCommander()) {
                        var commander = preferredCommander();
                        if (_.has(commander, 'UnitSpec'))
                            commander = commander.UnitSpec;
                        commanderIndex = _.indexOf(self.commanders(), commander);
                    }
                    selectedCommanderIndex(Math.max(commanderIndex, 0));
                });

                self.playerFactionIndex = ko.observable(0);
                self.playerFaction = ko.computed(function () {
                    var index = self.playerFactionIndex() % GWFactions.length;
                    return GWFactions[index];
                });
                self.playerFactionName = ko.computed(function () {
                    return self.playerFaction().name;
                });
                self.playerColor = ko.computed(function () {
                    return self.playerFaction().color;
                });
                self.playerColorCSS = ko.computed(function () {
                    return 'rgb(' + self.playerColor()[0].join(',') + ')';
                });
                self.playerSecondaryColorCSS = ko.computed(function () {
                    return 'rgb(' + self.playerColor()[1].join(',') + ')';
                });
                self.playerFactionTextOutlineCSS = ko.computed(function () {
                    //var colorFragment = self.playerSecondaryColorCSS();
                    var colorFragment = 'black';
                    var result =
                        '-1px -1px 3px ' + colorFragment + ', ' +
                        ' 1px -1px 3px ' + colorFragment + ', ' +
                        '-1px  1px 3px ' + colorFragment + ', ' +
                        ' 1px  1px 3px ' + colorFragment;
                    return result + ', ' + result; // Darken by doubling it up
                });
                self.nextFaction = function () {
                    if (!self.creditsMode())
                        self.playerFactionIndex((self.playerFactionIndex() + 1) % GWFactions.length);
                };

                self.archivedGames = ko.computed(function () {
                    return _.filter(GW.manifest.games(), function (game) { return game.state !== GWGame.gameStates.active; });
                });
                self.showArchivedGames = ko.computed(function () {
                    return !_.isEmpty(self.archivedGames());
                });

                // new game setup
                self.newGame = ko.observable();
                self.newGameSeed = ko.observable(Math.floor(Math.random() * 1000000).toString());

                var defaultNewGameName = function () {
                    return loc('!LOC:War - __date__', { date: UberUtility.createDateTimeString() });
                };
                self.newGameName = ko.observable(defaultNewGameName());
                self.newGameSizeIndex = ko.observable(1).extend({ numeric: 0 });
                self.newGameDifficultyIndex = ko.observable(0).extend({ numeric: 0 });
                self.newGameHardcore = ko.observable(false);

                self.startCards = ko.observableArray();
                self.activeStartCardIndex = ko.observable(0);
                self.activeStartCard = ko.computed(function () {
                    return self.startCards()[self.activeStartCardIndex()];
                });

                self.makeUnknown = function (cardData) {
                    return new UnknownCardViewModel(cardData);
                };
                self.makeKnown = function (cardData) {
                    var card = new CardViewModel(cardData);
                    card.active = ko.computed(function () {
                        return self.activeStartCard() === card;
                    });
                    card.btnClass = ko.computed(function () {
                        return card.active() ? 'card_active' : 'card';
                    });
                    card.activate = function () {
                        self.activeStartCardIndex(self.startCards().indexOf(card));
                    };
                    return card;
                };
                var getStartCards = function () {
                    var known = _.map(startCards, function (cardData, index) {
                        // Note: First card is built-in
                        if (index !== 0 && !GW.bank.hasStartCard(cardData))
                            return self.makeUnknown(cardData);
                        else
                            return self.makeKnown(cardData);
                    });

                    var unknown = _.filter(_.map(GW.bank.startCards(), function (cardData) {
                        return !_.some(startCards, _.bind(_.isEqual, null, cardData)) && self.makeKnown(cardData);
                    }));

                    return known.concat(unknown);
                };
                self.startCards(getStartCards());
                self.addStartCards = function (ids, isKnown /* = true */) {
                    ids.map(function (id) {
                        if (isKnown === false) {
                            self.startCards.push(self.makeUnknown({ id: id }))
                        } else {
                            self.startCards.push(self.makeKnown({ id: id }))
                        }
                    })
                };

                self.ready = ko.computed(function () {
                    return !!self.newGame() && !!self.activeStartCard();
                });

                self.showTutorial = function () {
                    $("#tutorial").dialog('open');
                };

                self.updateCommander = function () {
                    if (self.newGame())
                        self.newGame().inventory().setTag('global', 'commander', self.selectedCommander());
                }

                self.makeGameBusy = ko.observable(false);
                self.makeGame = function () {
                    self.newGame(undefined);

                    var busyToken = {};
                    self.makeGameBusy(busyToken);

                    var game = new GW.Game();

                    game.name(self.newGameName());
                    game.mode(self.mode());
                    game.hardcore(self.newGameHardcore());
                    game.content(api.content.activeContent());

                    var useEasySystems = GW.balance.difficultyInfo[self.newGameDifficultyIndex() || 0].useEasierSystemTemplate;
                    var systemTemplates = useEasySystems ? easy_system_templates : star_system_templates;
                    var sizes = GW.balance.numberOfSystems;
                    var size = sizes[self.newGameSizeIndex()] || 40;

                    if (self.creditsMode()) {
                        size = _.reduce(GWFactions, function (factionSum, faction) {
                            return _.reduce(faction.teams, function (teamSum, team) {
                                return teamSum + (team.workers || []).length;
                            }, factionSum + 1);
                        }, 0);
                    }

                    self.updateCommander();
                    game.inventory().setTag('global', 'playerFaction', self.playerFactionIndex());
                    game.inventory().setTag('global', 'playerColor', self.playerColor());

                    var buildGalaxy = game.galaxy().build({
                        seed: self.newGameSeed(),
                        size: size,
                        difficultyIndex: self.newGameDifficultyIndex() || 0,
                        systemTemplates: systemTemplates,
                        content: game.content(),
                        minStarDistance: 2,
                        maxStarDistance: 4,
                        maxConnections: 4,
                        minimumDistanceBonus: 8
                    });
                    var dealStartCard = buildGalaxy.then(function (galaxy) {
                        if (self.makeGameBusy() !== busyToken)
                            return;
                        return GWDealer.dealCard({
                            id: self.activeStartCard().id(),
                            inventory: game.inventory(),
                            galaxy: galaxy,
                            star: galaxy.stars()[galaxy.origin()]
                        }).then(function (startCardProduct) {
                            game.inventory().cards.push(startCardProduct || { id: self.activeStartCard().id() });
                        });
                    });
                    var moveIn = dealStartCard.then(function () {
                        if (self.makeGameBusy() !== busyToken)
                            return;
                        game.move(game.galaxy().origin());

                        var star = game.galaxy().stars()[game.currentStar()];
                        star.explored(true);

                        game.gameState(GW.Game.gameStates.active);
                    });
                    var populate = moveIn.then(function () {
                        if (self.makeGameBusy() !== busyToken)
                            return;

                        // Scatter some AIs
                        var aiFactions = _.range(GWFactions.length);
                        aiFactions.splice(self.playerFactionIndex(), 1);
                        if (!self.creditsMode())
                            aiFactions = _.shuffle(aiFactions);
                        var teams = _.map(aiFactions, GWTeams.getTeam);
                        if (self.creditsMode()) {
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
                        if (self.creditsMode())
                            neutralStars = 0;

                        return GWBreeder.populate({
                            galaxy: game.galaxy(),
                            teams: teams,
                            neutralStars: neutralStars,
                            orderedSpawn: self.creditsMode(),
                            spawn: function (star, ai) {
                            },
                            canSpread: function (star, ai) {
                                return !self.creditsMode() || !ai || !!teams[ai.team].workers.length;
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
                        if (self.makeGameBusy() !== busyToken)
                            return;

                        // DIFFICULTY RAMPING CODE
                        //console.log(" START DIFFICULTY RAMPING ");
                        var maxDist = _.reduce(game.galaxy().stars(), function (value, star) {
                            return Math.max(star.distance(), value);
                        }, 0);
                        var diffInfo = GW.balance.difficultyInfo[game.galaxy().difficultyIndex];

                        var setAIData = function (ai, dist, isBoss) {
                            //console.log("AI DIFF START: " + ai + " dist: " + dist + " boss: " + isBoss);
                            if (ai.personality === undefined)
                                ai.personality = {};
                            if (diffInfo.rampDifficulty) {
                                ai.econ_rate = diffInfo.econBase + (dist * diffInfo.econRatePerDist);
                                //console.log(ai.name + " setAI RATE: " + ai.econ_rate);

                                var sizeMod = GW.balance.galaxySizeDiffMod[self.newGameSizeIndex() || 0];

                                ai.personality.metal_drain_check = diffInfo.metalDrainCheck + (dist * diffInfo.metalDrainCheckPerDist * sizeMod);
                                ai.personality.metal_demand_check = diffInfo.metalDemandCheck + (dist * diffInfo.metalDemandCheckPerDist * sizeMod);
                                ai.personality.energy_drain_check = diffInfo.energyDrainCheck + (dist * diffInfo.energyDrainCheckPerDist * sizeMod);
                                ai.personality.energy_demand_check = diffInfo.energyDemandCheck + (dist * diffInfo.energyDemandCheckPerDist * sizeMod);
                            }
                            else {
                                ai.personality.metal_drain_check = diffInfo.metalDrainCheck;
                                ai.personality.metal_demand_check = diffInfo.metalDemandCheck;
                                ai.personality.energy_drain_check = diffInfo.energyDrainCheck;
                                ai.personality.energy_demand_check = diffInfo.energyDemandCheck;
                            }

                            if (!isBoss) {
                                ai.personality.neural_data_mod = diffInfo.neuralDataMod;
                            }
                            ai.personality.micro_type = diffInfo.microType;
                            ai.personality.go_for_the_kill = diffInfo.goForKill;
                            ai.personality.priority_scout_metal_spots = diffInfo.priority_scout_metal_spots;
                            ai.personality.factory_build_delay_min = diffInfo.factory_build_delay_min;
                            ai.personality.factory_build_delay_max = diffInfo.factory_build_delay_max;
                            ai.personality.adv_eco_mod = diffInfo.adv_eco_mod;
                            ai.personality.adv_eco_mod_alone = diffInfo.adv_eco_mod_alone;
                            ai.personality.unable_to_expand_delay = diffInfo.unable_to_expand_delay;
                            ai.personality.enable_commander_danger_responses = diffInfo.enable_commander_danger_responses;
                            ai.personality.per_expansion_delay = diffInfo.per_expansion_delay;
                            ai.personality.fabber_to_factory_ratio_basic = diffInfo.fabber_to_factory_ratio_basic;
                            ai.personality.fabber_to_factory_ratio_advanced = diffInfo.fabber_to_factory_ratio_advanced;
                            ai.personality.fabber_alone_on_planet_mod = diffInfo.fabber_alone_on_planet_mod;
                            ai.personality.basic_to_advanced_factory_ratio = diffInfo.basic_to_advanced_factory_ratio;
                            ai.personality.factory_alone_on_planet_mod = diffInfo.factory_alone_on_planet_mod;
                            ai.personality.min_basic_fabbers = diffInfo.min_basic_fabbers;
                            ai.personality.max_basic_fabbers = diffInfo.max_basic_fabbers;
                            ai.personality.min_advanced_fabbers = diffInfo.min_advanced_fabbers;
                            ai.personality.max_advanced_fabbers = diffInfo.max_advanced_fabbers;
                            ai.personality.personality_tags = diffInfo.personality_tags

                            //console.log("AI DIFF END: ");
                        };

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
                                var numMinions = Math.floor((diffInfo.mandatoryMinions + ((worker.star.distance() / maxDist) * 2)) * diffInfo.minionMod);
                                if (numMinions > 0) {
                                    worker.ai.minions = [];
                                    _.times(numMinions, function () {
                                        var mnn = _.sample(GWFactions[info.faction].minions);
                                        setAIData(mnn, dist, false);
                                        mnn.color = worker.ai.color;
                                        worker.ai.minions.push(mnn);
                                    });
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

                        if (self.creditsMode()) {
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
                        if (self.makeGameBusy() !== busyToken)
                            return;

                        self.makeGameBusy(false);
                        self.newGame(game);
                        self.updateCommander();
                        return game;
                    });
                }

                self.runCredits = function () {
                    GWFactions.splice(0, GWFactions.length);
                    _.forEach(GWFactionsCredits, function (creditsFaction) { GWFactions.push(creditsFaction); });
                    self.newGameName('Credits');
                    self.playerFaction.notifySubscribers();
                    self.makeGame();
                };

                self.makeGameOrRunCredits = function () {
                    if (self.creditsMode())
                        self.runCredits();
                    else
                        self.makeGame();
                };

                self.setup = function () { };

                var makeGameRule = ko.pureComputed(function () {
                    return [
                        self.newGameSeed(),
                        self.newGameName(),
                        self.newGameSizeIndex(),
                        self.playerFactionIndex(),
                        self.activeStartCard(),
                        self.newGameDifficultyIndex(),
                        self.newGameHardcore()
                    ];
                });

                makeGameRule.subscribe(function () {
                    if (self.creditsMode())
                        return;
                    self.makeGame();
                });

                self.makeGameOrRunCredits();

                $("#tutorial").dialog({
                    draggable: false,
                    resizable: false,
                    width: 800,
                    height: 680,
                    modal: true,
                    autoOpen: false,
                    buttons: {}
                });
            }

            ko.computed(function () {
                if (!GW.manifest.ready())
                    return;
                _.delay(function () {
                    model = new GameViewModel();

                    handlers = {};

                    // inject per scene mods
                    if (scene_mod_list['gw_start'])
                        loadMods(scene_mod_list['gw_start']);

                    // setup send/recv messages and signals
                    app.registerWithCoherent(model, handlers);

                    // Activates knockout.js
                    ko.applyBindings(model);
                    model.setup();
                });
            });
        });

    });
