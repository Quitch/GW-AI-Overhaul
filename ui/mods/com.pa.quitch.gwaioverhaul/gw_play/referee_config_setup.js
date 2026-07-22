// Army/personality setup helpers for the battle-config referee (gw_play/referee_config.js).
// These build the player/AI/subcommander armies and resolve their ai_paths - the
// referee's assertable logic - so they are split out here into their own measured
// module (directly unit-tested by test/referee_config_ai_paths.test.js) while
// referee_config.js keeps only the model/ko/api glue that assembles the final config
// and is coverage-excluded. All collaborators are shipped mod modules injected the same
// way referee_config.js injected them, so nothing needs param-threading.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js",
], function (gwoColour, gwoAI, subcommanderTech) {
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
      ai.personality.adv_eco_mod *= gwoAI.setAIEconRate(ai.econ_rate); // co-op games in older wars could result in negative eco - so we can't trust econ_rate to be valid.
      ai.personality.adv_eco_mod_alone *= gwoAI.setAIEconRate(ai.econ_rate); // co-op games in older wars could result in negative eco - so we can't trust econ_rate to be valid.
    }
    return ai;
  };

  // The game guarantees the player and the enemy are never simultaneously Cluster,
  // so returning the same unscoped ai_cluster path regardless of isPlayer is safe -
  // there's only ever one Cluster side per match to route there.
  var setAIPath = function (isCluster, isPlayer) {
    if (isCluster) {
      return gwoAI.getAIPathDestination("cluster");
    } else if (isPlayer) {
      return gwoAI.getAIPathDestination("subcommander");
    }
    return gwoAI.getAIPathDestination("enemy");
  };

  var setupAIArmy = function (ai, index, specTag, alliance) {
    var slotsArray = [];
    var aiLandingOptions = _.shuffle([
      "off_player_planet",
      "on_player_planet",
      "no_restriction",
    ]);
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
      econ_rate: gwoAI.setAIEconRate(ai.econ_rate), // co-op games in older wars could result in negative eco - so we can't trust econ_rate to be valid.
      personality: ai.personality,
      spec_tag: specTag,
      alliance_group: alliance,
    };
  };

  var setupAlliedCommanders = function (
    allies,
    cards,
    armies,
    inventory,
    playerTag
  ) {
    var playerFaction = inventory.getTag("global", "playerFaction");
    var playerIsCluster = inventory.getTag("global", "playerFaction") === 4;

    _.forEach(allies, function (ally, index) {
      ally.personality.ai_path = setAIPath(playerIsCluster, true); // Avoid breaking Sub Commanders from earlier versions
      ally.personality = applySubcommanderTacticsTech(ally.personality, cards);
      ally.personality = applySubcommanderFabberTech(ally.personality, cards);
      ally.commanderCount = applySubcommanderDuplicationTech(cards);
      ally.faction = playerFaction;
      var allyIndex = index + 1;
      var subcommanderArmy = setupAIArmy(ally, allyIndex, playerTag, 1);
      armies.push(subcommanderArmy);
    });
  };

  var setupPrimaryAiAndMinions = function (
    ai,
    connectedPlayerCards,
    aiTag,
    aiInUse,
    armies
  ) {
    ai = setAdvEcoMod(ai, aiInUse);
    var guardians = ai.mirrorMode;

    if (guardians) {
      ai.personality = setupGuardianPersonality(
        connectedPlayerCards,
        ai.personality,
        aiInUse
      );
    }

    var aiArmy = setupAIArmy(ai, 0, aiTag[0], 2);
    armies.push(aiArmy);
    var aiPath = setAIPath(gwoAI.isCluster(ai), false);
    ai.personality.ai_path = aiPath;

    _.forEach(ai.minions, function (minion, index) {
      minion = setAdvEcoMod(minion, aiInUse);
      minion.personality.ai_path = aiPath;
      minion.faction = ai.faction;
      var colourIndex = index + 1; // primary AI has colour 0
      var aiArmy = setupAIArmy(minion, colourIndex, aiTag[0], 2);
      armies.push(aiArmy);
    });
  };

  var setupFfaAis = function (foes, aiTag, aiInUse, armies) {
    _.forEach(foes, function (foe, index) {
      foe = setAdvEcoMod(foe, aiInUse);
      foe.personality.ai_path = setAIPath(gwoAI.isCluster(foe), false);
      var foeTag = index + 1; // 0 taken by primary AI
      var foeAlliance = index + 3; // 1 & 2 taken by player and primary AI
      var aiArmy = setupAIArmy(foe, 0, aiTag[foeTag], foeAlliance);
      armies.push(aiArmy);
    });
  };

  return {
    setAIPath: setAIPath,
    setupAlliedCommanders: setupAlliedCommanders,
    setupPrimaryAiAndMinions: setupPrimaryAiAndMinions,
    setupFfaAis: setupFfaAis,
  };
});
