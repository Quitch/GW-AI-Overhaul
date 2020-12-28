var galacticWarOverhaulLoaded;

if (!galacticWarOverhaulLoaded) {
  galacticWarOverhaulLoaded = true;

  try {
    if (!model.game().isTutorial())
      requireGW(["shared/gw_factions"], function (GWFactions) {
        _.forEach(model.galaxy.systems(), function (system) {
          ko.computed(function () {
            var ai = system.star.ai();
            if (!ai) return;
            else if (ai.treasurePlanet === true)
              normalizedColor = [255, 255, 255];
            else {
              var faction = GWFactions[ai.faction];
              // Ensures we assign faction colour, not minion colour, to each system
              var normalizedColor = _.map(faction.color[0], function (c) {
                return c / 255;
              });
            }
            system.ownerColor(normalizedColor.concat(3));
            // Dependencies. These will cause the base code that updates color to rerun, so we have to run under the same conditions, and pray we run later than that code.
            system.connected();
            model.cheats.noFog();
            system.star.hasCard();
          });
        });
      });
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
