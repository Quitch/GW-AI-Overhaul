// Assembles a base faction from its data. The four shadowed gw_faction_*.js
// files differ only in what they pass here; the measured sibling of those
// shadows alongside faction/faction_seed.js - see galaxy.md and shadowing.md.
define(function () {
  var build = function (data) {
    var baseline = data.baseline;
    // The Random commander's pool, captured before it joins so it can never
    // draw its own personality. Its shipped personality is a default;
    // faction_seed.js redraws it from the war seed.
    var randomFrom = data.minions.slice();
    var minions = data.minions.concat([data.randomAI]);

    return {
      name: data.name,
      color: data.colour,
      coopPlayerColors: data.coopPlayerColors,
      teams: [
        {
          name: data.name,
          boss: _.merge(_.cloneDeep(baseline), data.boss),
          systemDescription: data.descriptions[0],
          systemTemplate: {
            name: data.name,
            Planets: data.planets,
          },
        },
      ],
      minions: _.map(minions, function (personalityModifiers) {
        return _.merge(_.cloneDeep(baseline), personalityModifiers);
      }),
      gwaioRandomSpec: {
        baseline: baseline,
        descriptions: data.descriptions,
        randoms: [
          {
            index: minions.length - 1,
            template: data.randomAI,
            from: randomFrom,
          },
        ],
      },
    };
  };

  return { build: build };
});
