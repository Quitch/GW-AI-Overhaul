// Battle-config referee: assembles the launch config (armies, planets, game
// modes). Glue - the measured half is gw_play/referee_config_setup.js.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config_setup.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biomes.js",
], function (gwoAI, gwoCards, refereeCoop, configSetup, gwoStreams, gwoBiomes) {
  var setupAlliedCommanders = configSetup.setupAlliedCommanders;
  var setupPrimaryAiAndMinions = configSetup.setupPrimaryAiAndMinions;
  var setupFfaAis = configSetup.setupFfaAis;

  // The system came from another mod, so this is a trust boundary: a biome the
  // server cannot load hangs every player at loading. See galaxy.md.
  var loadablePlanets = function (planets, systemName, served) {
    _.forEach(planets, function (planet) {
      var generator = gwoBiomes.generatorOf(planet);
      var biome = gwoBiomes.planetBiome(planet);
      if (
        generator &&
        !gwoBiomes.isStockBiome(biome) &&
        !_.has(served || {}, biome)
      ) {
        console.warn(
          "gwoRefereeConfig: '" +
            systemName +
            "' uses biome '" +
            biome +
            "', which the Galactic War server cannot load; using '" +
            gwoBiomes.FALLBACK_BIOME +
            "' instead"
        );
        generator.biome = gwoBiomes.FALLBACK_BIOME;
      }
    });
    return planets;
  };

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

  var modifyPlanets = function (inventory, planets, game, systemName, served) {
    var canGlassPlanets = gwoCards.anyPlayerHasCard(
      inventory,
      "gwaio_enable_orbitalbombardment",
      game
    );
    var canFloodPlanets =
      gwoCards.anyPlayerHasCard(inventory, "gwaio_enable_tsunami", game) ||
      gwoCards.anyPlayerHasCard(inventory, "gwaio_start_naval", game);

    planets = loadablePlanets(planets, systemName, served);
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
    var galaxy = game.galaxy();
    var currentStar = galaxy.stars()[game.currentStar()];
    var system = currentStar.system();
    var ai = currentStar.ai();
    // Keyed on the turn as well as the star, so retrying a lost battle still
    // reshuffles - loseTurn does not advance the turn, so the retry needs
    // another move. See galaxy.md, "Play-scene streams".
    var battleRng = gwoStreams.battleRng(
      gwoStreams.warRng(galaxy.stars()[galaxy.origin()].system().gwaio),
      game.currentStar(),
      game.stats().turns()
    );
    var aiInUse = gwoAI.aiInUse("enemy");
    var aiTag = gwoAI.aiTags(ai);

    setupAlliedCommanders(
      inventory.minions(),
      cards,
      armies,
      inventory,
      playerTag,
      0,
      battleRng
    );

    // The ally is coloured after every player's subcommanders, viewers' included,
    // so it never shifts one the war panel is already showing. See coop.md.
    if (!_.isUndefined(ai.ally)) {
      setupAlliedCommanders(
        [ai.ally],
        cards,
        armies,
        inventory,
        playerTag,
        refereeCoop.getOrderedSubcommanders(inventory, game).length,
        battleRng
      );
    }

    setupPrimaryAiAndMinions(
      ai,
      connectedPlayerCards,
      aiTag,
      aiInUse,
      armies,
      battleRng
    );
    setupFfaAis(ai.foes, aiTag, aiInUse, armies, battleRng);
    system.planets = modifyPlanets(
      inventory,
      system.planets,
      game,
      system.name,
      self.biomeServed
    );

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
