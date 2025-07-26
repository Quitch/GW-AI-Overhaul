define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
], function (gwoColour, gwoAI) {
  const setAIPath = function (isCluster, isPlayer) {
    if (isCluster) {
      return gwoAI.getAIPathDestination("cluster");
    } else if (isPlayer) {
      return gwoAI.getAIPathDestination("subcommander");
    }
    return gwoAI.getAIPathDestination("enemy");
  };

  const applySubcommanderTacticsTech = function (personality, cards) {
    if (_.some(cards, { id: "gwaio_upgrade_subcommander_tactics" })) {
      personality.micro_type = 2;
      personality.go_for_the_kill = true;
      personality.priority_scout_metal_spots = true;
      personality.enable_commander_danger_responses = true;
      _.pull(personality.personality_tags, "SlowerExpansion");
      personality.personality_tags.push("PreventsWaste");
    }
    return personality;
  };

  const applySubcommanderFabberTech = function (personality, cards) {
    if (_.some(cards, { id: "gwaio_upgrade_subcommander_fabber" })) {
      personality.max_basic_fabbers = Math.round(
        personality.max_basic_fabbers * 1.5
      );
      personality.max_advanced_fabbers = Math.round(
        personality.max_advanced_fabbers * 1.5
      );
    }
    return personality;
  };

  const applySubcommanderDuplicationTech = function (cards) {
    if (
      _.some(cards, {
        id: "gwaio_upgrade_subcommander_duplication",
      })
    ) {
      return 2;
    }
    return 1;
  };

  const setAdvEcoMod = function (aiRoot, brain) {
    if (brain !== "Queller") {
      aiRoot.personality.adv_eco_mod *= aiRoot.econ_rate;
      aiRoot.personality.adv_eco_mod_alone *= aiRoot.econ_rate;
    }
    return aiRoot;
  };

  const aiCommander = function (name, unit, landingOptions, commanderNumber) {
    while (commanderNumber > landingOptions.length - 1) {
      commanderNumber -= landingOptions.length;
    }
    return {
      ai: true,
      name: name,
      commander: unit,
      landing_policy: landingOptions[commanderNumber],
    };
  };

  const getAIPersonalityName = function (ai) {
    var personalityName = ai.character ? loc(ai.character) : loc("!LOC:None");
    if (ai.penchantName) {
      personalityName = personalityName + " " + loc(ai.penchantName);
    }
    return personalityName;
  };

  const setupAIArmy = function (ai, index, specTag, alliance) {
    const slotsArray = [];
    const aiLandingOptions = _.shuffle([
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
      econ_rate: ai.econ_rate,
      personality: ai.personality,
      spec_tag: specTag,
      alliance_group: alliance,
    };
  };

  const countCards = function (cards, type) {
    var countOfType = 0;
    _.forEach(cards, function (card) {
      if (_.includes(card.id, type)) {
        countOfType++;
      }
    });
    return countOfType;
  };

  const calculatePercentage = function (typeCards, totalCards) {
    return typeCards === 0 ? 0 : typeCards / totalCards;
  };

  const quellerGuardianPersonality = function (personality) {
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
      // case 4: do nothing
    }
    return aiPersonalityTags;
  };

  const setupGuardianPersonality = function (cards, personality, aiInUse) {
    const totalAirCards = countCards(cards, "_air");
    const totalBotCards = countCards(cards, "_bot");
    const totalOrbitalCards = countCards(cards, "_orbital");
    const totalSeaCards = countCards(cards, "_sea");
    const totalVehicleCards = countCards(cards, "_vehicle");
    const totalCards =
      totalAirCards +
      totalBotCards +
      totalOrbitalCards +
      totalSeaCards +
      totalVehicleCards;
    if (totalCards > 0) {
      personality.percent_air = calculatePercentage(totalAirCards, totalCards);
      personality.percent_bot = calculatePercentage(totalBotCards, totalCards);
      personality.percent_orbital = calculatePercentage(
        totalOrbitalCards,
        totalCards
      );
      personality.percent_naval = calculatePercentage(
        totalSeaCards,
        totalCards
      );
      personality.percent_vehicle = calculatePercentage(
        totalVehicleCards,
        totalCards
      );
    }
    if (aiInUse === "Queller") {
      personality.personality_tags = quellerGuardianPersonality(personality);
    }
    return personality;
  };

  const glassPlanets = function (planets) {
    const unglassableBiome = ["moon", "asteroid", "gas", "metal"];
    _.forEach(planets, function (planet) {
      if (!_.includes(unglassableBiome, planet.generator.biome)) {
        planet.generator.biome = "moon";
      }
    });
    return planets;
  };

  const floodPlanets = function (planets) {
    _.forEach(planets, function (planet) {
      const floodPlanet =
        !planet.generator.waterHeight || planet.generator.waterHeight < 50;
      if (floodPlanet) {
        planet.generator.waterHeight = 50;
      }
    });
    return planets;
  };

  return function () {
    const self = this;

    // Set up the player
    const game = self.game();
    const inventory = game.inventory();
    const cards = inventory.cards();
    const playerName = ko.observable().extend({ session: "displayName" });
    const playerTag = ".player";
    const armies = [
      {
        slots: [{ name: playerName() || "Player" }],
        color: inventory.getTag("global", "playerColor"),
        econ_rate: 1,
        spec_tag: playerTag,
        alliance_group: 1,
      },
    ];
    const currentStar = game.galaxy().stars()[game.currentStar()];
    var ai = currentStar.ai();
    const alliedCommanders = _.isUndefined(ai.ally)
      ? inventory.minions()
      : inventory.minions().concat(ai.ally);
    const playerFaction = inventory.getTag("global", "playerFaction");
    const playerIsCluster = playerFaction === 4;

    _.forEach(alliedCommanders, function (ally, index) {
      ally.personality.ai_path = setAIPath(playerIsCluster, true); // Avoid breaking Sub Commanders from earlier versions
      ally.personality = applySubcommanderTacticsTech(ally.personality, cards);
      ally.personality = applySubcommanderFabberTech(ally.personality, cards);
      ally.commanderCount = applySubcommanderDuplicationTech(cards);
      ally.faction = playerFaction;
      const allyIndex = index + 1;
      const subcommanderArmy = setupAIArmy(ally, allyIndex, playerTag, 1);
      armies.push(subcommanderArmy);
    });

    // Set up the AI
    const aiFactionCount = ai.foes ? 1 + ai.foes.length : 1;
    const aiTag = [];
    _.times(aiFactionCount, function (n) {
      const aiNewTag = ".ai" + n.toString();
      aiTag.push(aiNewTag);
    });
    const aiInUse = gwoAI.aiInUse("enemy");

    // Set up AI System Owner
    ai = setAdvEcoMod(ai, aiInUse);
    const guardians = ai.mirrorMode;
    if (guardians) {
      ai.personality = setupGuardianPersonality(cards, ai.personality, aiInUse);
    }

    // Avoid breaking enemies from earlier versions
    const aiIsCluster = gwoAI.isCluster(ai);
    const aiPath = setAIPath(aiIsCluster, false);
    ai.personality.ai_path = aiPath;

    var aiArmy = setupAIArmy(ai, 0, aiTag[0], 2);
    armies.push(aiArmy);

    _.forEach(ai.minions, function (minion, index) {
      minion = setAdvEcoMod(minion, aiInUse);

      // Avoid breaking enemies from earlier versions
      minion.personality.ai_path = aiPath;

      minion.faction = ai.faction;
      const minionIndex = index + 1; // primary AI has colour 0
      aiArmy = setupAIArmy(minion, minionIndex, aiTag[0], 2);
      armies.push(aiArmy);
    });

    // Set up Additional AI Factions
    _.forEach(ai.foes, function (foe, index) {
      foe = setAdvEcoMod(foe, aiInUse);

      // Avoid breaking enemies from earlier versions
      const foeIsCluster = gwoAI.isCluster(foe);
      foe.personality.ai_path = setAIPath(foeIsCluster, false);

      const foeTag = index + 1; // 0 taken by primary AI
      const foeAlliance = index + 3; //  1 & 2 taken by player and primary AI
      aiArmy = setupAIArmy(foe, 0, aiTag[foeTag], foeAlliance);
      armies.push(aiArmy);
    });

    const bountyMode =
      ai.bountyMode || inventory.hasCard("gwaio_enable_bounties");
    const suddenDeathMode =
      ai.suddenDeath || inventory.hasCard("gwaio_enable_suddendeath");
    const playerLandAnywhereMode = inventory.hasCard(
      "gwaio_enable_landanywhere"
    );
    const landAnywhereMode = ai.landAnywhere || playerLandAnywhereMode;
    const eradicationMode =
      ai.eradicationMode || inventory.hasCard("gwaio_enable_eradication");
    const canGlassPlanets = inventory.hasCard(
      "gwaio_enable_orbitalbombardment"
    );
    const canFloodPlanets =
      inventory.hasCard("gwaio_enable_tsunami") ||
      inventory.hasCard("gwaio_start_naval");

    if (canGlassPlanets) {
      currentStar.system().planets = glassPlanets(currentStar.system().planets);
    }

    if (canFloodPlanets) {
      currentStar.system().planets = floodPlanets(currentStar.system().planets);
    }

    const config = {
      files: self.files(),
      armies: armies,
      player: {
        commander: inventory.getTag("global", "commander"),
      },
      system: currentStar.system(),
      land_anywhere: landAnywhereMode,
      bounty_mode: bountyMode,
      bounty_value: ai.bountyModeValue,
      sudden_death_mode: suddenDeathMode,
      eradication_mode: eradicationMode,
      eradication_mode_sub_commanders: ai.eradicationModeSubCommanders,
      eradication_mode_factories: ai.eradicationModeFactories,
      eradication_mode_fabricators: ai.eradicationModeFabbers,
    };
    _.forEach(config.armies, function (army) {
      // eslint-disable-next-line lodash/prefer-filter
      _.forEach(army.slots, function (slot) {
        if (slot.ai) {
          if (army.alliance_group === 1) {
            slot.commander += playerTag;
          } else {
            slot.commander += aiTag[army.alliance_group - 2];
          }
        }
      });
    });
    config.player.commander += playerTag;
    // Store the game in the config for diagnostic purposes.
    config.gw = game.save();
    self.config(config);
  };
});
