// GWO's copy of the two base-game gw_teams.js methods war creation uses, seeded so a war
// seed picks the same team and generates the same boss system.
//
// A copy in GWO's namespace rather than a shadow of pages/gw_start/gw_teams: the base
// game calls getTeam as _.map(aiFactions, GWTeams.getTeam), which would hand an added rng
// parameter the array index. Shadowing meant either accepting that hazard or duck-typing
// around it; owning the module removes it. See shadowing.md.
//
// makeWorker is not carried over - gw_start/setup.js has replaced it with its own since
// long before this, to preserve personality_tags through a _.cloneDeep.
define([
  "main/game/galactic_war/shared/js/systems/template-loader",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_system_templates.js",
  "shared/gw_factions",
], function (activeStarSystemTemplates, gwoSystemTemplates, GWFactions) {
  return {
    getTeam: function (index, rng) {
      var faction = GWFactions[index],
        team = rng.pick(faction.teams); // GWO - was _.sample
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
            if (team.systemDescription) {
              system.description = team.systemDescription;
            }
            system.biome = system.planets[0].generator.biome;
            star.system(system);
            return ai;
          });
      }
      return $.when(ai);
    },
  };
});
