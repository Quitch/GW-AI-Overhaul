// Registers the races before any referee runs. See races.md.
var gwoPlayRacesLoaded;

function gwoPlayRaces() {
  if (gwoPlayRacesLoaded) {
    return;
  }

  gwoPlayRacesLoaded = true;

  try {
    model.gwoRaces = _.isArray(model.gwoRaces) ? model.gwoRaces : [];

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_mods.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
      ],
      function (raceMods, gwoAI) {
        raceMods.registerAll();

        // A war resumed with a race mod missing or updated loses units with
        // no other warning. See races.md.
        var settings = gwoAI.originSettings(model.game());
        var recorded = settings && settings.races && settings.races.mods;
        if (!_.isArray(recorded) || !recorded.length) {
          return;
        }
        raceMods.installedRaces().then(function (info) {
          var problems = [];
          _.forEach(recorded, function (mod) {
            var active = _.find(info.mods, { identifier: mod.identifier });
            if (!active) {
              problems.push(mod.identifier + " " + loc("!LOC:missing"));
            } else if (active.version !== mod.version) {
              problems.push(
                mod.identifier + " " + mod.version + " -> " + active.version
              );
            }
          });
          if (problems.length) {
            console.warn("gwoRaces: " + problems.join("; "));
            if (model.gwoRaceWarning) {
              model.gwoRaceWarning(
                loc("!LOC:Race mods changed since this war began:") +
                  " " +
                  problems.join("; ")
              );
            }
          }
        });
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoPlayRaces();
