// The measured half of gw_play/referee_config.js - see testing.md, "Coverage".
//
// Everything passed in is a live persisted war object, and none of this setup is
// idempotent, so each entity is deep-copied before it is modified. The armies get
// the battle's values; the war keeps its own. See architecture.md.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js",
], function (gwoColour, gwoAI, refereeCoop, subcommanderTech) {
  var applySubcommanderTacticsTech =
    subcommanderTech.applySubcommanderTacticsTech;
  var applySubcommanderFabberTech =
    subcommanderTech.applySubcommanderFabberTech;
  var applySubcommanderDuplicationTech =
    subcommanderTech.applySubcommanderDuplicationTech;

  var aiCommander = function (name, unit, landingOptions, commanderNumber) {
    return {
      ai: true,
      name: name,
      commander: unit,
      landing_policy: landingOptions[commanderNumber % landingOptions.length],
    };
  };

  var getAIPersonalityName = function (ai) {
    var personalityName = ai.character ? loc(ai.character) : loc("!LOC:None");
    if (ai.penchantName) {
      personalityName = personalityName + " " + loc(ai.penchantName);
    }
    return personalityName;
  };

  var countCards = function (cards, type) {
    var countOfType = 0;
    _.forEach(cards, function (card) {
      if (_.includes(card.id, type)) {
        countOfType++;
      }
    });
    return countOfType;
  };

  var calculatePercentage = function (typeCards, totalCards) {
    return typeCards === 0 ? 0 : typeCards / totalCards;
  };

  var quellerGuardianPersonality = function (personality) {
    var unitPercentages = [
      personality.percent_vehicle,
      personality.percent_bot,
      personality.percent_orbital,
      personality.percent_air,
      personality.percent_naval,
    ];
    var highestValue = _.max(unitPercentages);
    var valueIndex = unitPercentages.indexOf(highestValue);
    var aiPersonalityTags = ["queller"];
    switch (valueIndex) {
      case 0:
        aiPersonalityTags.push("tank");
        break;
      case 1:
        aiPersonalityTags.push("bot");
        break;
      case 2:
        aiPersonalityTags.push("orbital");
        break;
      case 3:
        aiPersonalityTags.push("air");
        break;
      default:
        // falls through - Queller has no naval personality tag
        break;
    }
    return aiPersonalityTags;
  };

  var setupGuardianPersonality = function (cards, personality, aiInUse) {
    var allCards = {
      air: countCards(cards, "_air"),
      bot: countCards(cards, "_bot"),
      orbital: countCards(cards, "_orbital"),
      naval: countCards(cards, "_sea"),
      vehicle: countCards(cards, "_vehicle"),
    };
    var totalCards = _.sum(allCards);
    if (totalCards > 0) {
      personality.percent_air = calculatePercentage(allCards.air, totalCards);
      personality.percent_bot = calculatePercentage(allCards.bot, totalCards);
      personality.percent_orbital = calculatePercentage(
        allCards.orbital,
        totalCards
      );
      personality.percent_naval = calculatePercentage(
        allCards.naval,
        totalCards
      );
      personality.percent_vehicle = calculatePercentage(
        allCards.vehicle,
        totalCards
      );
    }
    if (aiInUse === "Queller") {
      personality.personality_tags = quellerGuardianPersonality(personality);
    }
    return personality;
  };

  var setAdvEcoMod = function (ai, brain) {
    if (brain !== "Queller") {
      ai.personality.adv_eco_mod *= gwoAI.aiEconRateWithFloor(ai.econ_rate);
      ai.personality.adv_eco_mod_alone *= gwoAI.aiEconRateWithFloor(
        ai.econ_rate
      );
    }
    return ai;
  };

  // One unscoped path regardless of isPlayer: the player and the enemy are never
  // simultaneously Cluster. See ai-paths.md, "Invariants".
  var setAIPath = function (isCluster, isPlayer) {
    if (isCluster) {
      return gwoAI.getAIPathDestination("cluster");
    } else if (isPlayer) {
      return gwoAI.getAIPathDestination("subcommander");
    }
    return gwoAI.getAIPathDestination("enemy");
  };

  var setupAIArmy = function (
    ai,
    index,
    specTag,
    alliance,
    econRateOverride,
    rng
  ) {
    var slotsArray = [];
    var landingOptions = [
      "off_player_planet",
      "on_player_planet",
      "no_restriction",
    ];
    var aiLandingOptions = rng
      ? rng.shuffle(landingOptions)
      : _.shuffle(landingOptions);
    _.times(
      ai.bossCommanders ||
        ai.commanderCount ||
        // legacy GWO support
        (ai.landing_policy && ai.landing_policy.length) ||
        1,
      function (count) {
        slotsArray.push(
          aiCommander(ai.name, ai.commander, aiLandingOptions, count)
        );
      }
    );
    ai.personality.display_name = getAIPersonalityName(ai); // support Show AI Personality Names mod
    return {
      slots: slotsArray,
      color: gwoColour.pick(ai.faction, ai.color, index),
      econ_rate: _.isNumber(econRateOverride)
        ? econRateOverride
        : gwoAI.aiEconRateWithFloor(ai.econ_rate),
      personality: ai.personality,
      spec_tag: specTag,
      alliance_group: alliance,
    };
  };

  // startPosition is a place in the player-faction colour sequence. It defaults
  // to 0, the subcommanders; a star's ai.ally is numbered after them. See coop.md.
  var setupAlliedCommanders = function (
    allies,
    cards,
    armies,
    inventory,
    playerTag,
    startPosition,
    battleRng
  ) {
    var playerFaction = inventory.getTag("global", "playerFaction");
    var playerIsCluster = inventory.getTag("global", "playerFaction") === 4;
    var firstPosition = startPosition || 0;

    _.forEach(allies, function (liveAlly, index) {
      var ally = _.cloneDeep(liveAlly);
      ally.personality.ai_path = setAIPath(playerIsCluster, true); // Avoid breaking Sub Commanders from earlier versions
      ally.personality = applySubcommanderTacticsTech(ally.personality, cards);
      ally.personality = applySubcommanderFabberTech(ally.personality, cards);
      ally.commanderCount = applySubcommanderDuplicationTech(cards);
      ally.faction = playerFaction;
      var allyIndex = refereeCoop.alliedColourIndex(firstPosition + index);
      var subcommanderArmy = setupAIArmy(
        ally,
        allyIndex,
        playerTag,
        1,
        gwoAI.subcommanderEconRate,
        battleRng && battleRng.stream("landing_ally", firstPosition + index)
      );
      armies.push(subcommanderArmy);
    });
  };

  var setupPrimaryAiAndMinions = function (
    liveStarAi,
    connectedPlayerCards,
    aiTag,
    aiInUse,
    armies,
    battleRng
  ) {
    // Cloning the AI clones its minions with it, so the minion loop below is copying too.
    var ai = setAdvEcoMod(_.cloneDeep(liveStarAi), aiInUse);
    var guardians = ai.mirrorMode;

    if (guardians) {
      ai.personality = setupGuardianPersonality(
        connectedPlayerCards,
        ai.personality,
        aiInUse
      );
    }

    var aiArmy = setupAIArmy(
      ai,
      0,
      aiTag[0],
      2,
      undefined,
      battleRng && battleRng.stream("landing_enemy", 0)
    );
    armies.push(aiArmy);
    var aiPath = setAIPath(gwoAI.isCluster(ai), false);
    ai.personality.ai_path = aiPath;

    _.forEach(ai.minions, function (minion, index) {
      minion = setAdvEcoMod(minion, aiInUse);
      minion.personality.ai_path = aiPath;
      minion.faction = ai.faction;
      var colourIndex = index + 1; // primary AI has colour 0
      var aiArmy = setupAIArmy(
        minion,
        colourIndex,
        aiTag[0],
        2,
        undefined,
        battleRng && battleRng.stream("landing_enemy", colourIndex)
      );
      armies.push(aiArmy);
    });
  };

  var setupFfaAis = function (foes, aiTag, aiInUse, armies, battleRng) {
    _.forEach(foes, function (liveFoe, index) {
      var foe = setAdvEcoMod(_.cloneDeep(liveFoe), aiInUse);
      foe.personality.ai_path = setAIPath(gwoAI.isCluster(foe), false);
      var foeTag = index + 1; // 0 taken by primary AI
      var foeAlliance = index + 3; // 1 & 2 taken by player and primary AI
      var aiArmy = setupAIArmy(
        foe,
        0,
        aiTag[foeTag],
        foeAlliance,
        undefined,
        battleRng && battleRng.stream("landing_foe", index)
      );
      armies.push(aiArmy);
    });
  };

  return {
    getAIPersonalityName: getAIPersonalityName,
    setAIPath: setAIPath,
    setupAlliedCommanders: setupAlliedCommanders,
    setupPrimaryAiAndMinions: setupPrimaryAiAndMinions,
    setupFfaAis: setupFfaAis,
  };
});
