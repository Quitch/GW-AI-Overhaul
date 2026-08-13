// Builds and re-scales Galactic Conquest AIs during a war, mirroring the
// worker/boss blocks of gw_start/setup.js's onPopulated so a garrison, foe or
// ally is shaped exactly like its war-generation counterpart. create() takes
// every engine value as a dependency so the module loads under the Node
// harness. See docs/conquest.md.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_scaling.js",
], function (gwoScaling) {
  var GAME_MODIFIER_FIELDS = [
    "landAnywhere",
    "suddenDeath",
    "bountyMode",
    "bountyModeValue",
    "eradicationMode",
    "eradicationModeSubCommanders",
    "eradicationModeFactories",
    "eradicationModeFabbers",
  ];

  // deps: { cfg (gwaio.conquest), factions (GWFactions), factionTechs,
  //   clusterCommanderMods, penchants, quellerCompatibleMinions,
  //   aiType (gwaio.ai), aiAllyType (gwaio.aiAlly), playerFaction }
  var create = function (deps) {
    var cfg = deps.cfg;
    var difficulty = cfg.difficulty;
    var bossCommanders = difficulty.bossCommanders * cfg.playerCount;

    var minionPool = function (faction, aiType) {
      var pool = deps.factions[faction].minions;
      return aiType === "Queller" ? deps.quellerCompatibleMinions(pool) : pool;
    };

    var applyPersonality = function (rng, ai, aiType, faction) {
      var applied = gwoScaling.applyPersonality(
        rng,
        ai,
        _.assign({}, cfg.personality, { aiType: aiType, faction: faction }),
        deps.penchants
      );
      if (!applied) {
        console.error("Conquest could not apply an AI personality");
      }
    };

    var econRate = function (rng, tier, withPlayerCount) {
      return gwoScaling.econRate(rng, tier, {
        econBase: difficulty.econBase,
        econRatePerDist: difficulty.econRatePerDist,
        mandatoryMinions: difficulty.mandatoryMinions,
        minionMod: difficulty.minionMod,
        playerCount: withPlayerCount ? cfg.playerCount : undefined,
      });
    };

    var minionCountAt = function (tier) {
      return gwoScaling.countMinions(
        difficulty.mandatoryMinions * cfg.playerCount,
        difficulty.minionMod * cfg.playerCount,
        tier
      );
    };

    var applyBuffTech = function (rng, ai, tier, recordBuffs) {
      var techBuffs = gwoScaling.buffs(
        rng,
        tier,
        difficulty.factionTechHandicap
      );
      if (recordBuffs) {
        ai.typeOfBuffs = techBuffs; // for intelligence reports
      }
      ai.inventory = ai.isCluster === true ? deps.clusterCommanderMods : [];
      ai.inventory = gwoScaling.applyTech(
        techBuffs,
        ai.inventory,
        ai.faction,
        deps.factionTechs
      );
    };

    var buildMinion = function (minionRng, ai, clusterType) {
      var minion = gwoScaling.selectMinion(
        minionRng,
        minionPool(ai.faction, deps.aiType),
        ai.faction,
        clusterType
      );
      if (!minion) {
        return undefined;
      }
      applyPersonality(minionRng, minion, deps.aiType, ai.faction);
      return minion;
    };

    // The onPopulated boss block's minion rules: a Cluster boss fields one
    // Security carrying the whole count as commanders.
    var buildBossMinions = function (rng, boss, tier) {
      var numMinions = minionCountAt(tier);
      delete boss.minions;
      if (numMinions <= 0) {
        return;
      }
      boss.minions = [];
      var clusterType = "";
      var totalMinions = numMinions;
      if (boss.isCluster === true) {
        clusterType = "Security";
        totalMinions = 1;
      }
      _.times(totalMinions, function (minionIndex) {
        var minionRng = rng.stream("minion", minionIndex);
        var minion = buildMinion(minionRng, boss, clusterType);
        if (!minion) {
          return;
        }
        minion.econ_rate = econRate(minionRng, tier, true);
        if (boss.isCluster === true) {
          minion.commanderCount = numMinions;
        }
        boss.minions.push(minion);
      });
    };

    // The onPopulated worker block's minion rules: a Cluster Worker commander
    // gets extra commanders in place of minions.
    var buildWorkerMinions = function (rng, ai, tier) {
      var numMinions = minionCountAt(tier);
      delete ai.minions;
      delete ai.commanderCount;
      if (numMinions <= 0) {
        return;
      }
      var clusterType = "";
      var totalMinions = numMinions;
      var clusterWorkers = 0;
      if (ai.isCluster === true) {
        clusterType = "Worker";
        clusterWorkers = gwoScaling.clusterCommanderCount(
          numMinions,
          bossCommanders
        );
        totalMinions = 1;
      }
      if (ai.name === "Worker") {
        ai.commanderCount = Math.max(clusterWorkers, 2);
        return;
      }
      ai.minions = [];
      _.times(totalMinions, function (minionIndex) {
        var minionRng = rng.stream("minion", minionIndex);
        var minion = buildMinion(minionRng, ai, clusterType);
        if (!minion) {
          return;
        }
        minion.econ_rate = econRate(minionRng, tier, true);
        if (ai.isCluster === true) {
          minion.commanderCount = clusterWorkers;
        }
        ai.minions.push(minion);
      });
    };

    var foeCommanderCount = function (foe, tier) {
      var numMinions = minionCountAt(tier);
      // Cluster Workers get additional commanders in place of armies
      return foe.name === "Worker"
        ? gwoScaling.clusterCommanderCount(numMinions, bossCommanders)
        : Math.round((numMinions + 1) / 2);
    };

    return {
      // Capture-time rolls, stamped on whichever ai occupies the star.
      rollGameModifiers: function (rng, ai) {
        var gameModes = cfg.gameModes;
        ai.landAnywhere = gwoScaling.gameModeEnabled(
          rng,
          gameModes.landAnywhereChance
        );
        ai.suddenDeath = gwoScaling.gameModeEnabled(
          rng,
          gameModes.suddenDeathChance
        );
        ai.bountyMode = gwoScaling.gameModeEnabled(
          rng,
          gameModes.bountyModeChance
        );
        ai.bountyModeValue = gameModes.bountyModeValue;
        ai.eradicationMode = gwoScaling.gameModeEnabled(
          rng,
          gameModes.eradicationModeChance
        );
        gwoScaling.enableEradicationModeTypes(rng, ai);
      },

      // The star keeps its capture-time rolls when the boss that made them
      // moves on and would re-roll for its next capture.
      copyGameModifiers: function (from, to) {
        _.forEach(GAME_MODIFIER_FIELDS, function (field) {
          if (from[field] === undefined) {
            delete to[field];
          } else {
            to[field] = from[field];
          }
        });
      },

      // The ai left behind when a boss vacates a captured star.
      buildGarrison: function (params) {
        var rng = params.rng;
        var base = {
          commander: "/pa/units/commanders/imperial_delta/imperial_delta.json",
          econ_rate: 1,
          color: params.color,
          team: params.team,
        };
        var minion = gwoScaling.selectMinion(
          rng,
          minionPool(params.faction, deps.aiType),
          params.faction
        );
        if (!minion) {
          return undefined;
        }
        var ai = _.assign(base, minion);
        ai.faction = params.faction;
        applyPersonality(rng, ai, deps.aiType, ai.faction);
        ai.econ_rate = econRate(rng, params.tier, true);
        applyBuffTech(rng, ai, params.tier, true);
        buildWorkerMinions(rng, ai, params.tier);
        return ai;
      },

      buildFoe: function (params) {
        var rng = params.rng;
        var foe = gwoScaling.selectMinion(
          rng,
          minionPool(params.foeFaction, deps.aiType),
          params.foeFaction
        );
        if (!foe) {
          return undefined;
        }
        foe.faction = params.foeFaction;
        applyPersonality(rng, foe, deps.aiType, foe.faction);
        foe.econ_rate = econRate(rng, params.tier, true);
        foe.commanderCount = foeCommanderCount(foe, params.tier);
        applyBuffTech(rng, foe, params.tier, false);
        return foe;
      },

      buildAlly: function (params) {
        var rng = params.rng;
        var pool = minionPool(deps.playerFaction, deps.aiAllyType);
        var ally = gwoScaling.selectMinion(rng, pool, deps.playerFaction);
        if (!ally) {
          return undefined;
        }
        ally.faction = deps.playerFaction;
        if (deps.aiAllyType === "Penchant") {
          gwoScaling.applyPenchant(rng, ally, undefined, deps.penchants);
        }
        return ally;
      },

      refreshBoss: function (rng, boss, tier) {
        boss.econ_rate = econRate(rng, tier, false);
        applyBuffTech(rng, boss, tier, true);
        buildBossMinions(rng, boss, tier);
      },

      refreshGarrison: function (rng, ai, tier) {
        ai.econ_rate = econRate(rng, tier, true);
        applyBuffTech(rng, ai, tier, true);
        buildWorkerMinions(rng, ai, tier);
      },

      refreshFoe: function (rng, foe, tier) {
        foe.econ_rate = econRate(rng, tier, true);
        foe.commanderCount = foeCommanderCount(foe, tier);
        applyBuffTech(rng, foe, tier, false);
      },

      // Idempotent, unlike war generation's one-shot tagging: Conquest foes
      // accumulate over turns and the tags must not stack up with them.
      ensureQuellerFFATags: function (ai) {
        if (deps.aiType !== "Queller" || !ai.foes || !ai.foes.length) {
          return;
        }
        var tagged = function (target) {
          return (
            target && _.includes(target.personality.personality_tags, "ffa")
          );
        };
        var applyTo = function (target) {
          if (target && !tagged(target)) {
            gwoScaling.applyQuellerFFATags(target);
          }
        };
        applyTo(ai);
        _.forEach(ai.minions || [], applyTo);
        _.forEach(ai.foes, applyTo);
        applyTo(ai.ally);
      },
    };
  };

  return { create: create };
});
