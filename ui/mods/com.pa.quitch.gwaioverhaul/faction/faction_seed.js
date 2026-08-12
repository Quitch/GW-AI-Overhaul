// Re-derives the random parts of a faction from the war seed. The measured
// sibling of the shadowed gw_faction_*.js files - see galaxy.md and shadowing.md.
define(() => {
  const reseedFaction = (faction, rng) => {
    const spec = faction && faction.gwaioRandomSpec;
    if (!spec || !rng) {
      return;
    }

    _.forEach(spec.randoms, (random, order) => {
      const source = rng.stream("minion", order).pick(random.from);
      // An empty pool keeps the default the faction file shipped.
      if (!source || !faction.minions) {
        return;
      }
      // Rebuilt through the faction file's own merge - writing .personality onto
      // the existing minion would skip the baseline's faction-wide fields.
      faction.minions[random.index] = _.merge(
        _.cloneDeep(spec.baseline),
        random.template,
        { personality: source.personality },
      );
    });

    if (spec.descriptions && faction.teams && faction.teams[0]) {
      faction.teams[0].systemDescription = rng
        .stream("description")
        .pick(spec.descriptions);
    }

    // Cluster only: its boss planets are isExplicit, so template-loader returns
    // them verbatim and the biome written here is the one used.
    _.forEach(spec.biomes, (entry, order) => {
      const biome = rng.stream("biome", order).pick(entry.from);
      if (biome && entry.generator) {
        entry.generator.biome = biome;
      }
    });
  };

  const reseed = (factions, rng) => {
    if (!rng) {
      return;
    }
    _.forEach(factions, (faction, index) => {
      reseedFaction(faction, rng.stream("faction", index));
    });
  };

  return {
    reseedFaction,
    reseed,
  };
});
