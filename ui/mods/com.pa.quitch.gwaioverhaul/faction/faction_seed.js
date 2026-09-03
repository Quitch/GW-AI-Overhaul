// Re-derives the random parts of a faction from the war seed. The measured
// sibling of the shadowed gw_faction_*.js files - see galaxy.md and shadowing.md.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_personality.js",
], function (gwoPersonality) {
  var reseedFaction = function (faction, rng) {
    var spec = faction && faction.gwaioRandomSpec;
    if (!spec || !rng) {
      return;
    }

    _.forEach(spec.randoms, function (random, order) {
      var source = rng.stream("minion", order).pick(random.from);
      // An empty pool keeps the default the faction file shipped.
      if (!source || !faction.minions) {
        return;
      }
      // Rebuilt through the faction file's own merge - writing .personality onto
      // the existing minion would skip the baseline's faction-wide fields. The
      // template's own default personality is left out: the drawn one is
      // sparse, and merging it over the default kept the default's keys. The
      // pool holds the raw declarations, so the drawn personality's id is
      // looked up the way faction_builder.js does.
      faction.minions[random.index] = _.merge(
        _.cloneDeep(spec.baseline),
        _.omit(random.template, "personality"),
        {
          personality: source.personality,
          personalityId:
            source.personalityId || gwoPersonality.idOf(source.personality),
        }
      );
    });

    if (spec.descriptions && faction.teams && faction.teams[0]) {
      faction.teams[0].systemDescription = rng
        .stream("description")
        .pick(spec.descriptions);
    }

    // Cluster only: its boss planets are isExplicit, so template-loader returns
    // them verbatim and the biome written here is the one used.
    _.forEach(spec.biomes, function (entry, order) {
      var biome = rng.stream("biome", order).pick(entry.from);
      if (biome && entry.generator) {
        entry.generator.biome = biome;
      }
    });
  };

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
