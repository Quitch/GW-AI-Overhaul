// Fills in the AIs the breeder placed, then the Guardians and the system lore.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_personality.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/brain_table.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
], function (gwoAI, gwoPersonality, gwoBrainTable, gwoRaces) {
  var FOUNDATION_FACTION = 1;

  // The brain an AI of this race runs on that side: the per-race table with
  // the war-wide dropdowns as its fallback. See races.md.
  var brainForRace = function (brains, race, side) {
    return gwoBrainTable.resolve(
      brains.aiByRace,
      brains.ai,
      brains.aiAlly,
      side,
      race
    );
  };

  // Bosses keep their commander and are retagged at launch; every other AI
  // of a race fields one of the race's own commanders. See races.md.
  var giveRace = function (rng, ai, race, keepCommander) {
    ai.race = gwoRaces.isMla(race) ? gwoRaces.MLA_ID : race;
    if (!keepCommander && !gwoRaces.isMla(race)) {
      var commander = gwoRaces.commanderFor(rng.stream("commander"), race);
      if (commander) {
        ai.commander = commander;
      }
    }
    return ai;
  };

  var setupAIBuffs = function (rng, distance, buffDistanceDelay) {
    // Negative near the origin once a tech handicap applies; rng.sample clamps to [].
    var numberBuffs = Math.floor(distance / 2 - buffDistanceDelay);
    return rng.sample(_.values(gwoAI.BUFF_TYPES), numberBuffs);
  };

  var countMinions = function (minionBase, minionStep, distance) {
    return Math.floor(minionBase + distance * minionStep);
  };

  var clusterCommanderCount = function (minionCount, bossCommanders) {
    return minionCount + Math.floor(bossCommanders / 2);
  };

  // clusterRole is given only for a Cluster faction, whose minions are picked
  // by role. Undefined when the pool has none, which fails the war.
  var selectMinion = function (rng, minions, faction, clusterRole) {
    var selectedMinion;
    if (clusterRole) {
      selectedMinion = _.cloneDeep(
        rng.pick(
          _.filter(minions, {
            name: clusterRole,
          })
        )
      );
    } else {
      selectedMinion = _.cloneDeep(rng.pick(minions));
    }
    // Call sites must check the result. These run inside jQuery deferred
    // callbacks, where a throw escapes .fail() instead of rejecting, so a
    // TypeError here hangs Go To War with no seed retry.
    if (_.isUndefined(selectedMinion)) {
      console.error("No minion found for faction " + faction);
    }
    return selectedMinion;
  };

  var aiEcoMinionReduction = function (
    eco,
    ecoStep,
    distance,
    minionBase,
    minionStep
  ) {
    var minions = 0;
    var previousMinions = 0;

    if (distance > 0) {
      minions = countMinions(minionBase, minionStep, distance);
      previousMinions = countMinions(minionBase, minionStep, distance - 1);
    }

    if (minions > previousMinions) {
      return eco - ecoStep;
    }

    return eco;
  };

  // Omitting playerCount skips the minion-count reduction (e.g. a boss's own rate).
  var aiEconRate = function (rng, settings, distance, playerCount) {
    var ecoBase = Number.parseFloat(settings.econBase());
    var ecoStep = Number.parseFloat(settings.econRatePerDist());
    var eco = (ecoBase + distance * ecoStep) * rng.float(0.9, 1.1);

    if (playerCount) {
      var minionBase = settings.mandatoryMinions() * playerCount;
      var minionStep = Number.parseFloat(settings.minionMod()) * playerCount;
      eco = aiEcoMinionReduction(
        eco,
        ecoStep,
        distance,
        minionBase,
        minionStep
      );
    }

    return Math.max(ecoBase, eco);
  };

  // rng.int bounds are inclusive - from 0, a 0% chance would still fire 1 in 101.
  var gameModeEnabled = function (rng, gameModeChance) {
    return rng.int(1, 100) <= gameModeChance;
  };

  var enableAnEradicationModeTypes = function (rng, ai) {
    var numberOfModes = rng.int(1, 3);

    _.forEach(
      rng.sample(gwoAI.ERADICATION_MODES, numberOfModes),
      function (mode) {
        ai["eradicationMode" + mode] = true;
      }
    );
  };

  var setupQuellerFFATag = function (ais) {
    if (!ais) {
      return;
    }

    var ffa = gwoPersonality.FFA_TAGS;

    if (_.isArray(ais)) {
      _.forEach(ais, function (ai) {
        ai.personality.personality_tags =
          ai.personality.personality_tags.concat(ffa);
      });
    } else {
      ais.personality.personality_tags =
        ais.personality.personality_tags.concat(ffa);
    }
  };

  // Queller has no build orders for some minions, so a pool drawn from under
  // that brain is filtered first.
  var quellerPool = function (pool, brain) {
    return brain === "Queller" ? gwoAI.quellerCompatibleMinions(pool) : pool;
  };

  // The AI's race is assigned before any personality, so the brain its race
  // actually runs is known here; a Penchant AI draws one penchant from its own
  // stream. The personality is built fresh from the template's id, never
  // edited on the template: stock's own makeGame writes into the templates.
  // False when the brain or faction is unknown, which fails the war. See
  // galaxy.md.
  var setAIPersonality = function (rng, ai, tier, faction, brains) {
    var ok = true;
    var brain = brainForRace(brains, ai.race, "enemy");
    if (brain === "Penchant") {
      ai.penchantName = gwoAI.penchants(rng).penchantName;
    } else if (brain !== "Queller" && brain !== "Titans") {
      console.error("Undefined AI type: " + brain);
      ok = false;
    }
    if (brain === "Queller" && !gwoPersonality.FACTION_IDS[faction]) {
      console.error("Undefined faction: " + faction);
      ok = false;
    }
    ai.personality = gwoPersonality.resolve(ai, {
      side: "enemy",
      faction: faction,
      tier: tier,
      brain: brain,
      penchantTags: gwoAI.penchantTags(ai.penchantName),
    });
    return ok;
  };

  var setupPlanetForAI = function (ai, sharedSystems, planet) {
    planet.generator.shuffleLandingZones = true;
    if (
      sharedSystems === false &&
      ai.faction === FOUNDATION_FACTION &&
      !ai.boss
    ) {
      planet.generator.waterHeight = 50;
    }
  };

  var personalise = function (context, rng, ai, faction) {
    if (!setAIPersonality(rng, ai, context.tier, faction, context.brains)) {
      context.outcome.failed = true;
    }
  };

  var pickMinion = function (context, rng, pool, faction, clusterRole) {
    var minion = selectMinion(rng, pool, faction, clusterRole);
    if (!minion) {
      context.outcome.failed = true;
    }
    return minion;
  };

  // One minion per stream index off the parent's rng. Given a cluster, each
  // is picked by cluster.role and carries cluster.commanderCount commanders;
  // only MLA Cluster callers pass one.
  var addMinions = function (
    context,
    minionPool,
    parent,
    parentRng,
    count,
    dist,
    cluster
  ) {
    parent.minions = [];
    _.times(count, function (minionIndex) {
      var minionRng = parentRng.stream("minion", minionIndex);
      var minion = pickMinion(
        context,
        minionRng,
        minionPool,
        parent.faction,
        cluster && cluster.role
      );
      if (!minion) {
        return;
      }
      giveRace(minionRng, minion, parent.race, false);
      personalise(context, minionRng, minion, parent.faction);
      minion.econ_rate = aiEconRate(
        minionRng,
        context.settings,
        dist,
        context.playerCount
      );
      if (cluster) {
        minion.commanderCount = cluster.commanderCount;
      }
      parent.minions.push(minion);
    });
  };

  var populateBoss = function (context, minionPool, boss, bossRng) {
    var maxDist = context.maxDist;
    personalise(context, bossRng, boss, boss.faction);
    boss.econ_rate = aiEconRate(bossRng, context.settings, maxDist);
    boss.typeOfBuffs = setupAIBuffs(
      bossRng,
      maxDist,
      context.factionTechHandicap
    );

    var bossMinions = countMinions(
      context.mandatoryMinions,
      context.minionMod,
      maxDist
    );

    if (bossMinions > 0) {
      if (gwoAI.isCluster(boss)) {
        addMinions(context, minionPool, boss, bossRng, 1, maxDist, {
          role: "Security",
          commanderCount: bossMinions,
        });
      } else {
        addMinions(context, minionPool, boss, bossRng, bossMinions, maxDist);
      }
    }
  };

  var setGameModes = function (rng, settings, ai) {
    ai.landAnywhere = gameModeEnabled(rng, settings.landAnywhereChance());
    ai.suddenDeath = gameModeEnabled(rng, settings.suddenDeathChance());
    ai.bountyMode = gameModeEnabled(rng, settings.bountyModeChance());
    ai.eradicationMode = gameModeEnabled(rng, settings.eradicationModeChance());
    enableAnEradicationModeTypes(rng, ai);
  };

  var addWorkerMinions = function (
    context,
    minionPool,
    ai,
    aiRng,
    dist,
    numMinions
  ) {
    if (!gwoAI.isCluster(ai)) {
      addMinions(context, minionPool, ai, aiRng, numMinions, dist);
    } else if (ai.name === "Worker") {
      // MLA Cluster Workers get additional commanders in place of
      // minions
      ai.minions = [];
      ai.commanderCount = Math.max(
        clusterCommanderCount(numMinions, context.bossCommanders),
        2
      );
    } else {
      addMinions(context, minionPool, ai, aiRng, 1, dist, {
        role: "Worker",
        commanderCount: clusterCommanderCount(
          numMinions,
          context.bossCommanders
        ),
      });
    }
  };

  var makeFoe = function (context, foeRng, foeFaction, dist, numMinions) {
    var war = context.war;
    var foeMinions = quellerPool(
      war.factions[foeFaction].minions,
      brainForRace(context.brains, war.raceByFaction[foeFaction], "enemy")
    );
    var foeCommander = pickMinion(context, foeRng, foeMinions, foeFaction);
    if (!foeCommander) {
      return undefined;
    }
    foeCommander.faction = foeFaction;
    giveRace(foeRng, foeCommander, war.raceByFaction[foeFaction], false);
    personalise(context, foeRng, foeCommander, foeCommander.faction);
    foeCommander.econ_rate = aiEconRate(
      foeRng,
      context.settings,
      dist,
      context.playerCount
    );
    var numFoes = Math.round((numMinions + 1) / 2);
    // MLA Cluster Workers get additional commanders in place of
    // armies
    if (gwoAI.isCluster(foeCommander) && foeCommander.name === "Worker") {
      numFoes = clusterCommanderCount(numMinions, context.bossCommanders);
    }
    foeCommander.commanderCount = numFoes;
    return foeCommander;
  };

  var addFoes = function (context, ai, aiRng, dist, numMinions) {
    var availableFactions = _.without(context.war.aiFactions, ai.faction);
    _.times(availableFactions.length, function (foeIndex) {
      var foeRng = aiRng.stream("foe", foeIndex);
      if (gameModeEnabled(foeRng, context.settings.ffaChance())) {
        if (!ai.foes) {
          ai.foes = [];
        }

        availableFactions = foeRng.shuffle(availableFactions);
        var foeFaction = availableFactions.shift();
        var foeCommander = makeFoe(
          context,
          foeRng,
          foeFaction,
          dist,
          numMinions
        );
        if (!foeCommander) {
          return;
        }

        // A foe fields its worker's tech. Recorded here; the spec mods
        // are built from it at launch.
        foeCommander.typeOfBuffs = ai.typeOfBuffs;

        ai.foes.push(foeCommander);
      }
    });
  };

  var addAlly = function (context, ai, aiRng) {
    var war = context.war;
    var allyRng = aiRng.stream("ally");
    if (
      !war.startCardBreaksAllies &&
      gameModeEnabled(allyRng, context.settings.alliedCommanderChance())
    ) {
      // The ally fights as the player's race, so its brain is that race's
      // ally cell.
      var allyBrain = brainForRace(context.brains, war.playerRace, "ally");
      var allyMinions = quellerPool(
        war.factions[war.playerFaction].minions,
        allyBrain
      );
      var allyCommander = pickMinion(
        context,
        allyRng,
        allyMinions,
        war.playerFaction
      );
      if (allyCommander) {
        allyCommander.faction = war.playerFaction;
        giveRace(allyRng, allyCommander, war.playerRace, false);
        // Every reader gives an ally the Sub Commander rate, so the save
        // carries no rate the template may hold.
        delete allyCommander.econ_rate;
        if (allyBrain === "Penchant") {
          allyCommander.penchantName = gwoAI.penchants(allyRng).penchantName;
        }
        allyCommander.personality = gwoPersonality.resolve(allyCommander, {
          side: "ally",
          faction: war.playerFaction,
          penchantTags: gwoAI.penchantTags(allyCommander.penchantName),
        });
        ai.ally = allyCommander;
      }
    }
  };

  var tagIfQueller = function (entities, brain) {
    if (brain === "Queller") {
      setupQuellerFFATag(entities);
    }
  };

  // Tagged per entity: in a mixed-race FFA only the armies actually running
  // Queller take its FFA tags.
  var tagQuellerFFA = function (context, ai) {
    var brains = context.brains;
    var workerBrain = brainForRace(brains, ai.race, "enemy");
    tagIfQueller(ai, workerBrain);
    tagIfQueller(ai.minions, workerBrain);
    _.forEach(ai.foes, function (foe) {
      tagIfQueller(foe, brainForRace(brains, foe.race, "enemy"));
    });
    tagIfQueller(ai.ally, brainForRace(brains, context.war.playerRace, "ally"));
  };

  var populateWorker = function (context, minionPool, worker, aiRng) {
    var ai = worker.ai;
    var settings = context.settings;

    setGameModes(aiRng, settings, ai);

    var dist = worker.star.distance();

    var numMinions = countMinions(
      context.mandatoryMinions,
      context.minionMod,
      dist
    );

    personalise(context, aiRng, ai, ai.faction);
    ai.econ_rate = aiEconRate(aiRng, settings, dist, context.playerCount);

    ai.typeOfBuffs = setupAIBuffs(aiRng, dist, context.factionTechHandicap);

    if (numMinions > 0) {
      addWorkerMinions(context, minionPool, ai, aiRng, dist, numMinions);
    }

    addFoes(context, ai, aiRng, dist, numMinions);
    addAlly(context, ai, aiRng);

    if (ai.foes) {
      tagQuellerFFA(context, ai);
    }
  };

  var populateTeam = function (context, info, teamIndex) {
    var war = context.war;
    var boss = info.boss;
    // Keyed, so an AI's rolls do not depend on what earlier AIs drew.
    var teamRng = war.rng.stream("ai", teamIndex);
    var bossRng = teamRng.stream("boss");

    if (!boss) {
      console.error(
        "No AI boss found for faction " +
          info.faction +
          ", terminating war generation"
      );
      context.outcome.failed = true;
      context.outcome.spawnShortage = true;
      return;
    }

    var teamBrain = brainForRace(
      context.brains,
      war.raceByFaction[info.faction],
      "enemy"
    );
    // The team pre-filter in war_generation.js covers the built-in factions;
    // this catches a modded faction populating team.workers.
    var workerPool = quellerPool(info.workers, teamBrain);
    var minionPool = quellerPool(war.factions[info.faction].minions, teamBrain);

    populateBoss(context, minionPool, boss, bossRng);

    _.forEach(workerPool, function (worker, workerIndex) {
      populateWorker(
        context,
        minionPool,
        worker,
        teamRng.stream("worker", workerIndex)
      );
    });
  };

  var makeGuardians = function (context, treasureRng, ai, system) {
    delete ai.commanderCount;
    delete ai.minions;
    delete ai.foes;
    delete ai.ally;
    delete ai.team;
    delete ai.penchantName;
    ai.icon =
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/guardians.png";
    ai.boss = true; // otherwise it won't display its icon
    ai.mirrorMode = true;
    ai.treasurePlanet = true;
    ai.econ_rate = aiEconRate(treasureRng, context.settings, context.maxDist);
    ai.name = "The Guardians";
    ai.character = "!LOC:Unknown";
    ai.color = [
      [255, 255, 255],
      [255, 192, 203],
    ];
    ai.commander = "/pa/units/commanders/raptor_unicorn/raptor_unicorn.json";
    // Mirrors the player, race included; keeps the Unicorn.
    giveRace(treasureRng, ai, context.war.playerRace, true);
    // The loadout itself is derived per player at exploration - see
    // gw_play/treasure_loadouts.js.
    system.description =
      "!LOC:This is a treasure planet, hiding a loadout you have yet to unlock. But beware the guardians! Armed with whatever technology bonuses you bring with you to this planet; they will stop at nothing to defend its secrets.";
  };

  var setupStars = function (context) {
    var war = context.war;
    var outcome = context.outcome;
    var loreEntry = 0;
    var optionalLoreEntry = 0;
    var treasureRng = war.rng.stream("treasure");
    _.forEach(war.galaxy.stars(), function (star, starIndex) {
      var ai = star.ai();
      var system = star.system();
      if (ai) {
        _.forEach(system.planets, function (planet) {
          setupPlanetForAI(ai, war.sharedSystems, planet);
        });

        if (!ai.boss) {
          // Winning the Guardians clears star.ai(), so the star has to be
          // identified by index for the loadout offer to survive the fight.
          if (_.isUndefined(outcome.treasureStar)) {
            outcome.treasureStar = starIndex;
            makeGuardians(context, treasureRng, ai, system);
          } else if (
            context.settings.paLore() &&
            war.lore.ai[optionalLoreEntry]
          ) {
            system.description = war.lore.ai[optionalLoreEntry];
            optionalLoreEntry += 1;
          }
        }
      } else if (war.lore.neutral[loreEntry]) {
        system.name = war.lore.neutral[loreEntry].name;
        system.description = war.lore.neutral[loreEntry].description;
        loreEntry += 1;
      }
    });
  };

  var populationContext = function (war) {
    var settings = war.settings;
    var playerCount = war.playerCount;
    return {
      war: war,
      settings: settings,
      brains: war.brains,
      playerCount: playerCount,
      tier: war.tier,
      maxDist: _.reduce(
        war.galaxy.stars(),
        function (value, star) {
          return Math.max(star.distance(), value);
        },
        0
      ),
      bossCommanders: settings.bossCommanders() * playerCount,
      factionTechHandicap: Number.parseFloat(settings.factionTechHandicap()),
      mandatoryMinions: settings.mandatoryMinions() * playerCount,
      minionMod: Number.parseFloat(settings.minionMod()) * playerCount,
      outcome: {
        failed: false,
        spawnShortage: false,
        treasureStar: undefined,
      },
    };
  };

  // Every AI in teamInfo, the breeder's result. Returns the outcome
  // war_generation.js acts on.
  var populate = function (war, teamInfo) {
    var context = populationContext(war);

    _.forEach(teamInfo, function (info, teamIndex) {
      populateTeam(context, info, teamIndex);
    });

    setupStars(context);

    return context.outcome;
  };

  return {
    brainForRace: brainForRace,
    giveRace: giveRace,
    populate: populate,
  };
});
