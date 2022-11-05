define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
], function (gwoColour, gwoAI) {
  var setAIPath = function (isCluster, isPlayer) {
    if (isCluster) {
      return gwoAI.getAIPath("cluster");
    } else if (isPlayer) {
      return gwoAI.getAIPath("subcommander");
    }
    return gwoAI.getAIPath("enemy");
  };

  var applySubcommanderTacticsTech = function (personality, cards) {
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

  var applySubcommanderFabberTech = function (personality, cards) {
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

  var hasSubcommanderDuplicationTech = function (cards) {
    return _.some(cards, {
      id: "gwaio_upgrade_subcommander_duplication",
    });
  };

  var setAdvEcoMod = function (aiRoot, brain) {
    if (brain !== "Queller") {
      aiRoot.personality.adv_eco_mod *= aiRoot.econ_rate;
      aiRoot.personality.adv_eco_mod_alone *= aiRoot.econ_rate;
    }
    return aiRoot;
  };

  var aiCommander = function (
    name,
    commander,
    landingOptions,
    commanderNumber
  ) {
    while (commanderNumber > landingOptions.length - 1) {
      commanderNumber -= landingOptions.length;
    }
    return {
      ai: true,
      name: name,
      commander: commander,
      landing_policy: landingOptions[commanderNumber],
    };
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
    return {
      slots: slotsArray,
      color: gwoColour.pick(ai.faction, ai.color, index),
      econ_rate: ai.econ_rate,
      personality: ai.personality,
      spec_tag: specTag,
      alliance_group: alliance,
    };
  };

  return function () {
    var self = this;

    // Set up the player
    var game = self.game();
    var inventory = game.inventory();
    var cards = inventory.cards();
    var playerName = ko.observable().extend({ session: "displayName" });
    var playerTag = ".player";
    var armies = [
      {
        slots: [{ name: playerName() || "Player" }],
        color: inventory.getTag("global", "playerColor"),
        econ_rate: 1,
        spec_tag: playerTag,
        alliance_group: 1,
      },
    ];
    var currentStar = game.galaxy().stars()[game.currentStar()];
    var ai = currentStar.ai();
    var alliedCommanders = _.isUndefined(ai.ally)
      ? inventory.minions()
      : inventory.minions().concat(ai.ally);
    var playerFaction = inventory.getTag("global", "playerFaction");
    var isCluster = playerFaction === 4;

    _.forEach(alliedCommanders, function (ally, index) {
      // Avoid breaking Sub Commanders from earlier versions
      ally.personality.ai_path = setAIPath(isCluster, true);

      ally.personality = applySubcommanderTacticsTech(ally.personality, cards);
      ally.personality = applySubcommanderFabberTech(ally.personality, cards);
      if (hasSubcommanderDuplicationTech(cards)) {
        ally.commanderCount = 2;
      }
      ally.faction = playerFaction;
      var allyIndex = index + 1;
      var subcommanderArmy = setupAIArmy(ally, allyIndex, playerTag, 1);
      armies.push(subcommanderArmy);
    });

    // Set up the AI
    var aiFactionCount = ai.foes ? 1 + ai.foes.length : 1;
    var aiTag = [];
    _.times(aiFactionCount, function (n) {
      var aiNewTag = ".ai";
      n = n.toString();
      aiNewTag = aiNewTag + n;
      aiTag.push(aiNewTag);
    });
    var aiBrain = gwoAI.aiInUse();

    // Set up AI System Owner
    ai = setAdvEcoMod(ai, aiBrain);

    // Avoid breaking enemies from earlier versions
    var aiIsCluster = ai.faction === 4 && ai.mirrorMode !== true;
    var aiPath = setAIPath(aiIsCluster, false);
    ai.personality.ai_path = aiPath;

    var aiArmy = setupAIArmy(ai, 0, aiTag[0], 2);
    armies.push(aiArmy);

    _.forEach(ai.minions, function (minion, index) {
      minion = setAdvEcoMod(minion, aiBrain);

      // Avoid breaking enemies from earlier versions
      minion.personality.ai_path = aiPath;

      minion.faction = ai.faction;
      var minionIndex = index + 1; // primary AI has colour 0
      aiArmy = setupAIArmy(minion, minionIndex, aiTag[0], 2);
      armies.push(aiArmy);
    });

    // Set up Additional AI Factions
    _.forEach(ai.foes, function (foe, index) {
      foe = setAdvEcoMod(foe, aiBrain);

      // Avoid breaking enemies from earlier versions
      var foeIsCluster = parseInt(foe.faction[0]) === 4; // was an array before v5.44.0
      foe.personality.ai_path = setAIPath(foeIsCluster, false);

      var foeTag = index + 1; // 0 taken by primary AI
      var foeAlliance = index + 3; //  1 & 2 taken by player and primary AI
      aiArmy = setupAIArmy(foe, 0, aiTag[foeTag], foeAlliance);
      armies.push(aiArmy);
    });

    var config = {
      files: self.files(),
      armies: armies,
      player: {
        commander: inventory.getTag("global", "commander"),
      },
      system: currentStar.system(),
      land_anywhere: ai.landAnywhere,
      bounty_mode: ai.bountyMode,
      bounty_value: ai.bountyModeValue,
      sudden_death_mode: ai.suddenDeath,
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
