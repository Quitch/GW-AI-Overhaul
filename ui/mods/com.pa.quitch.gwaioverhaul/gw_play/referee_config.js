// Battle-config referee: assembles the launch config (armies, planets, game modes) for
// a Galactic War fight. The army/personality setup and ai_path logic - the assertable
// part - lives in the measured gw_play/referee_config_setup.js (unit-tested by
// test/referee_config_ai_paths.test.js). What remains here reads model/ko/api and the
// game/inventory observables to build and store the final config, so it is
// coverage-excluded as untestable glue.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config_setup.js",
], function (gwoAI, gwoCards, configSetup) {
  var setupAlliedCommanders = configSetup.setupAlliedCommanders;
  var setupPrimaryAiAndMinions = configSetup.setupPrimaryAiAndMinions;
  var setupFfaAis = configSetup.setupFfaAis;

  var glassPlanets = function (planets) {
    var unglassableBiome = ["moon", "asteroid", "gas", "metal"];
    _.forEach(planets, function (planet) {
      if (!_.includes(unglassableBiome, planet.generator.biome)) {
        planet.generator.biome = "moon";
      }
    });
    return planets;
  };

  var floodPlanets = function (planets) {
    _.forEach(planets, function (planet) {
      var floodPlanet =
        !planet.generator.waterHeight || planet.generator.waterHeight < 50;
      if (floodPlanet) {
        planet.generator.waterHeight = 50;
      }
    });
    return planets;
  };

  var setupAiTags = function (ai) {
    var aiTag = [];
    var aiFactionCount = ai.foes ? 1 + ai.foes.length : 1;
    _.times(aiFactionCount, function (n) {
      var aiNewTag = ".ai" + n.toString();
      aiTag.push(aiNewTag);
    });

    return aiTag;
  };

  var modifyPlanets = function (inventory, planets, game) {
    var canGlassPlanets = gwoCards.anyPlayerHasCard(
      inventory,
      "gwaio_enable_orbitalbombardment",
      game
    );
    var canFloodPlanets =
      gwoCards.anyPlayerHasCard(inventory, "gwaio_enable_tsunami", game) ||
      gwoCards.anyPlayerHasCard(inventory, "gwaio_start_naval", game);

    if (canGlassPlanets) {
      planets = glassPlanets(planets);
    }
    if (canFloodPlanets) {
      planets = floodPlanets(planets);
    }

    return planets;
  };

  return function () {
    var self = this;

    // Set up the player
    var game = self.game();
    var inventory = game.inventory();
    var cards = inventory.cards();
    var connectedPlayerCards = gwoCards.getAllConnectedPlayerCards(
      inventory,
      game
    );
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
    var system = currentStar.system();
    var ai = currentStar.ai();
    var alliedCommanders = _.isUndefined(ai.ally)
      ? inventory.minions()
      : inventory.minions().concat(ai.ally);
    var aiInUse = gwoAI.aiInUse("enemy");
    var aiTag = setupAiTags(ai);

    setupAlliedCommanders(
      alliedCommanders,
      cards,
      armies,
      inventory,
      playerTag
    );
    setupPrimaryAiAndMinions(ai, connectedPlayerCards, aiTag, aiInUse, armies);
    setupFfaAis(ai.foes, aiTag, aiInUse, armies);
    system.planets = modifyPlanets(inventory, system.planets, game);

    var config = {
      files: self.files(),
      armies: armies,
      player: {
        commander: inventory.getTag("global", "commander"),
      },
      system: currentStar.system(),
      land_anywhere:
        ai.landAnywhere ||
        gwoCards.anyPlayerHasCard(inventory, "gwaio_enable_landanywhere", game),
      bounty_mode:
        ai.bountyMode ||
        gwoCards.anyPlayerHasCard(inventory, "gwaio_enable_bounties", game),
      bounty_value: ai.bountyModeValue,
      sudden_death_mode:
        ai.suddenDeath ||
        gwoCards.anyPlayerHasCard(inventory, "gwaio_enable_suddendeath", game),
      eradication_mode:
        ai.eradicationMode ||
        gwoCards.anyPlayerHasCard(inventory, "gwaio_enable_eradication", game),
      eradication_mode_sub_commanders: ai.eradicationModeSubCommanders,
      eradication_mode_factories: ai.eradicationModeFactories,
      eradication_mode_fabricators: ai.eradicationModeFabbers,
    };

    _.forEach(config.armies, function (army) {
      _.forEach(army.slots, function (slot) {
        if (slot.ai) {
          slot.commander += army.spec_tag;
        }
      });
    });
    config.player.commander += playerTag;
    // Store the game in the config for diagnostic purposes.
    config.gw = game.save();
    self.config(config);
  };
});
