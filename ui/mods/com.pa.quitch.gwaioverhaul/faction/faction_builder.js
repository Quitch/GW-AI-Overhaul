// Assembles a base faction from its data. The four shadowed gw_faction_*.js
// files differ only in what they pass here; the measured sibling of those
// shadows alongside faction/faction_seed.js - see galaxy.md and shadowing.md.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_personality.js",
], function (gwoPersonality) {
  // The id is looked up on the declaration's reference: the merge below
  // copies the personality, so nothing could identify it afterwards.
  var fromBaseline = function (baseline, modifiers) {
    var built = _.merge(_.cloneDeep(baseline), modifiers);
    var personalityId = gwoPersonality.idOf(modifiers.personality);
    if (personalityId) {
      built.personalityId = personalityId;
    }
    return built;
  };

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
          boss: fromBaseline(baseline, data.boss),
          systemDescription: data.descriptions[0],
          systemTemplate: {
            name: data.name,
            Planets: data.planets,
          },
        },
      ],
      minions: _.map(minions, function (personalityModifiers) {
        return fromBaseline(baseline, personalityModifiers);
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

  return { build: build, fromBaseline: fromBaseline };
});
