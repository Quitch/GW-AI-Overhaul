// GWO - getTeam and makeBoss take a seeded rng / seed (shared/gwo_rng.js), and stay stock
// without it. See galaxy.md, "Determinism and the war seed".
define([
  "main/game/galactic_war/shared/js/systems/template-loader",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_system_templates.js",
  "shared/gw_factions",
], function (activeStarSystemTemplates, gwoSystemTemplates, GWFactions) {
  return {
    getTeam: function (index, rng) {
      var faction = GWFactions[index],
        // GWO - duck-typed, not merely checked for presence: the base game
        // calls this as _.map(aiFactions, GWTeams.getTeam), so rng gets the index.
        team =
          rng && rng.pick ? rng.pick(faction.teams) : _.sample(faction.teams);
      return _.extend({}, team, {
        color: faction.color,
        faction: faction,
        remainingMinions: _.clone(faction.minions),
      });
    },

    makeBoss: function (star, ai, team, sst, seed) {
      if (team.boss) {
        _.assign(ai, team.boss);
      } else {
        ai.econ_rate = ai.econ_rate * 2;
      }
      if (team.bossCard) {
        star.cardList().push(team.bossCard);
      }
      if (team.systemTemplate) {
        var generatorConfig = {
          name: team.systemTemplate.name,
          template: {
            Planets: team.systemTemplate.Planets,
          },
          // GWO - stock omits this, so every boss system re-rolled its terrain.
          seed: seed,
        };
        return gwoSystemTemplates
          .chooseFor(activeStarSystemTemplates)
          .generate(generatorConfig)
          .then(function (system) {
            if (team.systemDescription)
              system.description = team.systemDescription;
            system.biome = system.planets[0].generator.biome;
            star.system(system);
            return ai;
          });
      } else return $.when(ai);
    },

    makeWorker: function (star, ai, team) {
      if (team.workers) {
        _.assign(ai, _.sample(team.workers));
      } else if (team.remainingMinions) {
        var minion = _.sample(
          team.remainingMinions.length
            ? team.remainingMinions
            : team.faction.minions
        );
        _.assign(ai, minion);
        _.remove(team.remainingMinions, function (minion) {
          return minion.name === ai.name;
        });
      }
      return $.when(ai);
    },
  };
});
