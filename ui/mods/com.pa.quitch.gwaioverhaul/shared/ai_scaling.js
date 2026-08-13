// AI scaling and build helpers extracted from gw_start/setup.js. Every engine
// value arrives as a parameter so the module loads under the Node harness.
define([], function () {
  // Index into ai_tech.js's factionTechs[faction][n]. 5 is absent because that
  // tech was removed; see the note by setupAITech5 there.
  var buffTypes = {
    cost: 0,
    damage: 1,
    health: 2,
    speed: 3,
    build: 4,
    combat: 6,
    cooldown: 7,
  };

  var buffs = function (rng, distance, buffDistanceDelay) {
    // Negative near the origin once a tech handicap applies; rng.sample clamps to [].
    var numberBuffs = Math.floor(distance / 2 - buffDistanceDelay);
    return rng.sample(_.values(buffTypes), numberBuffs);
  };

  var applyTech = function (selectedBuffs, inventory, faction, tech) {
    _.times(selectedBuffs.length, function (n) {
      inventory = inventory.concat(tech[faction][selectedBuffs[n]]);
    });
    return inventory;
  };

  var countMinions = function (minionBase, minionStep, distance) {
    return Math.floor(minionBase + distance * minionStep);
  };

  var clusterCommanderCount = function (minionCount, bossCommanders) {
    return minionCount + Math.floor(bossCommanders / 2);
  };

  var ecoMinionReduction = function (
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

  // Omitting cfg.playerCount skips the minion-count reduction (e.g. a boss's
  // own rate).
  var econRate = function (rng, distance, cfg) {
    var eco =
      (cfg.econBase + distance * cfg.econRatePerDist) * rng.float(0.9, 1.1);

    if (cfg.playerCount) {
      var minionBase = cfg.mandatoryMinions * cfg.playerCount;
      var minionStep = cfg.minionMod * cfg.playerCount;
      eco = ecoMinionReduction(
        eco,
        cfg.econRatePerDist,
        distance,
        minionBase,
        minionStep
      );
    }

    return Math.max(cfg.econBase, eco);
  };

  // rng.int bounds are inclusive - from 0, a 0% chance would still fire 1 in 101.
  var gameModeEnabled = function (rng, gameModeChance) {
    return rng.int(1, 100) <= gameModeChance;
  };

  var enableEradicationModeTypes = function (rng, ai) {
    var numberOfModes = rng.int(1, 3);
    var modes = ["SubCommanders", "Factories", "Fabbers"];

    _.forEach(rng.sample(modes, numberOfModes), function (mode) {
      ai["eradicationMode" + mode] = true;
    });
  };

  // Returns undefined rather than throwing when the pool yields nothing: call
  // sites run inside jQuery deferred callbacks, where a throw escapes .fail()
  // instead of rejecting, so they must check the result and abort themselves.
  var selectMinion = function (rng, minions, faction, minionName) {
    var isCluster = minionName === "Worker" || minionName === "Security";
    var selectedMinion;
    if (isCluster) {
      selectedMinion = _.cloneDeep(
        rng.pick(
          _.filter(minions, {
            name: minionName,
          })
        )
      );
    } else {
      selectedMinion = _.cloneDeep(rng.pick(minions));
    }
    if (_.isUndefined(selectedMinion)) {
      console.error("No minion found for faction " + faction);
    }
    return selectedMinion;
  };

  // Returns undefined for an unknown faction; callers concat `|| []` so a
  // literal undefined tag can never be appended.
  var quellerTags = function (faction) {
    var quellerTag = "queller";

    switch (faction) {
      case 0:
        return ["tank", quellerTag];
      case 1:
        return ["air", quellerTag];
      case 2:
        return ["bot", quellerTag];
      case 3:
        return ["orbital", quellerTag];
      case 4:
        return ["land", quellerTag];
      default:
        return undefined;
    }
  };

  // titansAITags is optional: concat would otherwise append a literal undefined
  // to personality_tags, which the save round-trips back as null.
  var applyPenchant = function (rng, ai, titansAITags, penchantsFn) {
    var penchantValues = penchantsFn(rng);
    ai.personality.personality_tags = ai.personality.personality_tags.concat(
      penchantValues.penchants,
      titansAITags || []
    );
    ai.penchantName = penchantValues.penchantName;
  };

  // Returns false when settings name an unknown AI type or faction, leaving the
  // caller to flag the failure - see selectMinion's note on throws.
  var applyPersonality = function (rng, ai, settings, penchantsFn) {
    var personality = ai.personality;

    personality.micro_type = settings.microType;
    personality.go_for_the_kill = settings.goForKill;
    personality.priority_scout_metal_spots = settings.priorityScoutMetalSpots;
    personality.factory_build_delay_min = settings.factoryBuildDelayMin;
    personality.factory_build_delay_max = settings.factoryBuildDelayMax;
    personality.unable_to_expand_delay = settings.unableToExpandDelay;
    personality.enable_commander_danger_responses =
      settings.enableCommanderDangerResponses;
    personality.per_expansion_delay = settings.perExpansionDelay;
    personality.max_basic_fabbers = settings.maxBasicFabbers;
    personality.max_advanced_fabbers = settings.maxAdvancedFabbers;
    personality.personality_tags = (settings.personalityTags || []).slice();
    // 0 means unset, leaving the AI to examine the spawn zone radius.
    if (settings.startingLocationEvaluationRadius > 0) {
      personality.starting_location_evaluation_radius =
        settings.startingLocationEvaluationRadius;
    }

    var titansAITags = ["Default"];

    switch (settings.aiType) {
      case "Penchant":
        applyPenchant(rng, ai, titansAITags, penchantsFn);
        return true;
      case "Queller": {
        var tags = quellerTags(settings.faction);
        personality.personality_tags = personality.personality_tags.concat(
          tags || []
        );
        if (!tags) {
          console.error("Undefined faction:", settings.faction);
          return false;
        }
        return true;
      }
      case "Titans":
        personality.personality_tags =
          personality.personality_tags.concat(titansAITags);
        return true;
      default:
        console.error("Undefined AI type:", settings.aiType);
        return false;
    }
  };

  var applyQuellerFFATags = function (ais) {
    if (!ais) {
      return;
    }

    var ffa = ["ffa", "platoon"];

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

  var startCardBreaksAllies = function (loadoutId, modderCardIds) {
    var breakingCards = ["nem_start_deepspace", "gwaio_start_tourist"];
    if (_.isArray(modderCardIds)) {
      breakingCards = breakingCards.concat(modderCardIds);
    }
    return _.includes(breakingCards, loadoutId);
  };

  return {
    buffTypes: buffTypes,
    buffs: buffs,
    applyTech: applyTech,
    countMinions: countMinions,
    clusterCommanderCount: clusterCommanderCount,
    econRate: econRate,
    gameModeEnabled: gameModeEnabled,
    enableEradicationModeTypes: enableEradicationModeTypes,
    selectMinion: selectMinion,
    quellerTags: quellerTags,
    applyPenchant: applyPenchant,
    applyPersonality: applyPersonality,
    applyQuellerFFATags: applyQuellerFFATags,
    startCardBreaksAllies: startCardBreaksAllies,
  };
});
