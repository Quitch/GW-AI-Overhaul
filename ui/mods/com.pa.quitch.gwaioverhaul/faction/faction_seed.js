// Re-derives the random parts of a faction from the war seed.
//
// Each faction file used to make three choices with _.sample at define() time: the
// "Random" minion's personality, the boss system's description, and (for Cluster) three
// planet biomes. Because they ran when the module loaded, they were fixed for the whole
// page but re-rolled on every entry into the gw_start scene - so the same seed produced a
// different Aryst0krat and a different Cluster homeworld each time.
//
// The faction files now declare those choices as a `gwaioRandomSpec` and leave a fixed
// default in place; gw_start/setup.js calls reseed() once per war, before anything reads
// GWFactions. This is the measured sibling of the base-game-shadowed gw_faction_*.js
// files (see shadowing.md's "Reaching shadowed logic from tests"): the data stays with
// the faction, the logic is here and unit-tested by test/faction_seed.test.js.
define(function () {
  // Sub-streams rather than sequential draws, so a faction gaining (say) a second random
  // minion cannot shift the description or biome its siblings get.
  var reseedFaction = function (faction, rng) {
    var spec = faction && faction.gwaioRandomSpec;
    if (!spec || !rng) {
      return;
    }

    _.forEach(spec.randoms, function (random, order) {
      var source = rng.stream("minion", order).pick(random.from);
      // A faction whose pool is empty keeps the default the faction file shipped,
      // rather than having its minion slot overwritten with undefined.
      if (!source || !faction.minions) {
        return;
      }
      // Rebuilt through the same merge the faction file's `minions:` map uses. Writing
      // .personality straight onto the existing minion would skip the baseline, leaving
      // the Random commander without the faction-wide fields every other minion has.
      faction.minions[random.index] = _.merge(
        _.cloneDeep(spec.baseline),
        random.template,
        { personality: source.personality }
      );
    });

    if (spec.descriptions && faction.teams && faction.teams[0]) {
      faction.teams[0].systemDescription = rng
        .stream("description")
        .pick(spec.descriptions);
    }

    // Cluster only: its boss system's planets are isExplicit, so template-loader returns
    // them verbatim and their biome is whatever the planet data carries.
    _.forEach(spec.biomes, function (entry, order) {
      var biome = rng.stream("biome", order).pick(entry.from);
      if (biome && entry.generator) {
        entry.generator.biome = biome;
      }
    });
  };

  // Keyed by position in GWFactions, so a faction's choices do not depend on how many
  // factions precede it or on what any of them drew.
  var reseed = function (factions, rng) {
    if (!rng) {
      return;
    }
    _.forEach(factions, function (faction, index) {
      reseedFaction(faction, rng.stream("faction", index));
    });
  };

  return {
    reseedFaction: reseedFaction,
    reseed: reseed,
  };
});
