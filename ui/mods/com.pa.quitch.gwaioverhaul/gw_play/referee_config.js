// Battle-config referee: assembles the launch config (armies, planets, game
// modes). Glue - the measured half is gw_play/referee_config_setup.js.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config_setup.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biomes.js",
], (gwoAI, gwoCards, refereeCoop, configSetup, gwoStreams, gwoBiomes) => {
  const setupAlliedCommanders = configSetup.setupAlliedCommanders;
  const setupPrimaryAiAndMinions = configSetup.setupPrimaryAiAndMinions;
  const setupFfaAis = configSetup.setupFfaAis;

  // The system came from another mod, so this is a trust boundary: a biome the
  // server cannot load hangs every player at loading. See galaxy.md.
  const loadablePlanets = (planets, systemName, served) => {
    _.forEach(planets, (planet) => {
      const generator = gwoBiomes.generatorOf(planet);
      const biome = gwoBiomes.planetBiome(planet);
      if (
        generator &&
        !gwoBiomes.isStockBiome(biome) &&
        !_.has(served || {}, biome)
      ) {
        console.warn(
          `gwoRefereeConfig: '${systemName}' uses biome '${biome}', which the Galactic War server cannot load; using '${gwoBiomes.FALLBACK_BIOME}' instead`,
        );
        generator.biome = gwoBiomes.FALLBACK_BIOME;
      }
    });
    return planets;
  };

  const glassPlanets = (planets) => {
    const unglassableBiome = ["moon", "asteroid", "gas", "metal"];
    _.forEach(planets, (planet) => {
      if (!_.includes(unglassableBiome, planet.generator.biome)) {
        planet.generator.biome = "moon";
      }
    });
    return planets;
  };

  const floodPlanets = (planets) => {
    _.forEach(planets, (planet) => {
      const floodPlanet =
        !planet.generator.waterHeight || planet.generator.waterHeight < 50;
      if (floodPlanet) {
        planet.generator.waterHeight = 50;
      }
    });
    return planets;
  };

  const modifyPlanets = (inventory, planets, game, systemName, served) => {
    const canGlassPlanets = gwoCards.anyPlayerHasCard(
      inventory,
      "gwaio_enable_orbitalbombardment",
      game,
    );
    const canFloodPlanets =
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
    const self = this;

    const game = self.game();
    const inventory = game.inventory();
    const cards = inventory.cards();
    const connectedPlayerCards = gwoCards.getAllConnectedPlayerCards(
      inventory,
      game,
    );
    const playerTag = ".player";
    const armies = [
      {
        slots: [{ name: model.displayName() || "Player" }],
        color: inventory.getTag("global", "playerColor"),
        econ_rate: 1,
        spec_tag: playerTag,
        alliance_group: 1,
      },
    ];
    const galaxy = game.galaxy();
    const currentStar = galaxy.stars()[game.currentStar()];
    // A copy: the planet changes below are the battle's, not the war's.
    const battleSystem = _.cloneDeep(currentStar.system());
    const ai = currentStar.ai();
    // Keyed on the turn as well as the star, so retrying a lost battle still
    // reshuffles - loseTurn does not advance the turn, so the retry needs
    // another move. See galaxy.md, "Play-scene streams".
    const battleRng = gwoStreams.battleRng(
      gwoStreams.warRng(gwoAI.originSettings(game)),
      game.currentStar(),
      game.stats().turns(),
    );
    const aiTag = gwoAI.aiTags(ai);

    setupAlliedCommanders(
      inventory.minions(),
      cards,
      armies,
      inventory,
      playerTag,
      0,
      battleRng,
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
        battleRng,
        { ffa: !_.isEmpty(ai.foes) },
      );
    }

    setupPrimaryAiAndMinions(
      ai,
      connectedPlayerCards,
      aiTag,
      armies,
      battleRng,
    );
    setupFfaAis(ai.foes, aiTag, armies, battleRng);
    battleSystem.planets = modifyPlanets(
      inventory,
      battleSystem.planets,
      game,
      battleSystem.name,
      self.biomeServed,
    );

    const config = {
      files: self.files(),
      armies,
      player: {
        commander: inventory.getTag("global", "commander"),
      },
      system: battleSystem,
      land_anywhere:
        ai.landAnywhere ||
        gwoCards.anyPlayerHasCard(inventory, "gwaio_enable_landanywhere", game),
      bounty_mode:
        ai.bountyMode ||
        gwoCards.anyPlayerHasCard(inventory, "gwaio_enable_bounties", game),
      bounty_value: gwoAI.bountyValue(ai),
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

    _.forEach(config.armies, (army) => {
      _.forEach(army.slots, (slot) => {
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
