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
], (gwoColour, gwoAI, refereeCoop, subcommanderTech) => {
  const applySubcommanderTacticsTech =
    subcommanderTech.applySubcommanderTacticsTech;
  const applySubcommanderFabberTech =
    subcommanderTech.applySubcommanderFabberTech;
  const applySubcommanderDuplicationTech =
    subcommanderTech.applySubcommanderDuplicationTech;

  const aiCommander = (name, unit, landingOptions, commanderNumber) => ({
    ai: true,
    name,
    commander: unit,
    landing_policy: landingOptions[commanderNumber % landingOptions.length],
  });

  const getAIPersonalityName = (ai) => {
    let personalityName = ai.character ? loc(ai.character) : loc("!LOC:None");
    if (ai.penchantName) {
      personalityName = `${personalityName} ${loc(ai.penchantName)}`;
    }
    return personalityName;
  };

  const countCards = (cards, type) => {
    let countOfType = 0;
    _.forEach(cards, (card) => {
      if (_.includes(card.id, type)) {
        countOfType++;
      }
    });
    return countOfType;
  };

  const calculatePercentage = (typeCards, totalCards) =>
    typeCards === 0 ? 0 : typeCards / totalCards;

  const quellerGuardianPersonality = (personality) => {
    const unitPercentages = [
      personality.percent_vehicle,
      personality.percent_bot,
      personality.percent_orbital,
      personality.percent_air,
      personality.percent_naval,
    ];
    const highestValue = _.max(unitPercentages);
    const valueIndex = unitPercentages.indexOf(highestValue);
    const aiPersonalityTags = ["queller"];
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

  const setupGuardianPersonality = (cards, personality, aiInUse) => {
    const allCards = {
      air: countCards(cards, "_air"),
      bot: countCards(cards, "_bot"),
      orbital: countCards(cards, "_orbital"),
      naval: countCards(cards, "_sea"),
      vehicle: countCards(cards, "_vehicle"),
    };
    const totalCards = Object.values(allCards).reduce(
      (total, count) => total + count,
      0
    );
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

  const setAdvEcoMod = (ai, brain) => {
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
  const setAIPath = (isCluster, isPlayer) => {
    if (isCluster) {
      return gwoAI.getAIPathDestination("cluster");
    } else if (isPlayer) {
      return gwoAI.getAIPathDestination("subcommander");
    }
    return gwoAI.getAIPathDestination("enemy");
  };

  const setupAIArmy = (ai, index, specTag, alliance, econRateOverride, rng) => {
    const slotsArray = [];
    const landingOptions = [
      "off_player_planet",
      "on_player_planet",
      "no_restriction",
    ];
    const aiLandingOptions = rng
      ? rng.shuffle(landingOptions)
      : _.shuffle(landingOptions);
    _.times(
      ai.bossCommanders ||
        ai.commanderCount ||
        // legacy GWO support
        (ai.landing_policy && ai.landing_policy.length) ||
        1,
      (count) => {
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
  const setupAlliedCommanders = (
    allies,
    cards,
    armies,
    inventory,
    playerTag,
    startPosition,
    battleRng
  ) => {
    const playerFaction = inventory.getTag("global", "playerFaction");
    const playerIsCluster = inventory.getTag("global", "playerFaction") === 4;
    const firstPosition = startPosition || 0;

    _.forEach(allies, (liveAlly, index) => {
      const ally = _.cloneDeep(liveAlly);
      ally.personality.ai_path = setAIPath(playerIsCluster, true); // Avoid breaking Sub Commanders from earlier versions
      ally.personality = applySubcommanderTacticsTech(ally.personality, cards);
      ally.personality = applySubcommanderFabberTech(ally.personality, cards);
      ally.commanderCount = applySubcommanderDuplicationTech(cards);
      ally.faction = playerFaction;
      const allyIndex = refereeCoop.alliedColourIndex(firstPosition + index);
      const subcommanderArmy = setupAIArmy(
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

  const setupPrimaryAiAndMinions = (
    liveStarAi,
    connectedPlayerCards,
    aiTag,
    aiInUse,
    armies,
    battleRng
  ) => {
    // Cloning the AI clones its minions with it, so the minion loop below is copying too.
    const ai = setAdvEcoMod(_.cloneDeep(liveStarAi), aiInUse);
    const guardians = ai.mirrorMode;

    if (guardians) {
      ai.personality = setupGuardianPersonality(
        connectedPlayerCards,
        ai.personality,
        aiInUse
      );
    }

    const aiArmy = setupAIArmy(
      ai,
      0,
      aiTag[0],
      2,
      undefined,
      battleRng && battleRng.stream("landing_enemy", 0)
    );
    armies.push(aiArmy);
    const aiPath = setAIPath(gwoAI.isCluster(ai), false);
    ai.personality.ai_path = aiPath;

    _.forEach(ai.minions, (minion, index) => {
      minion = setAdvEcoMod(minion, aiInUse);
      minion.personality.ai_path = aiPath;
      minion.faction = ai.faction;
      const colourIndex = index + 1; // primary AI has colour 0
      const aiArmy = setupAIArmy(
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

  const setupFfaAis = (foes, aiTag, aiInUse, armies, battleRng) => {
    _.forEach(foes, (liveFoe, index) => {
      const foe = setAdvEcoMod(_.cloneDeep(liveFoe), aiInUse);
      foe.personality.ai_path = setAIPath(gwoAI.isCluster(foe), false);
      const foeTag = index + 1; // 0 taken by primary AI
      const foeAlliance = index + 3; // 1 & 2 taken by player and primary AI
      const aiArmy = setupAIArmy(
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
    setAIPath,
    setupAlliedCommanders,
    setupPrimaryAiAndMinions,
    setupFfaAis,
  };
});
