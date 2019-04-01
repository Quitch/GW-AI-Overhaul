requireGW([
  'shared/gw_factions'
], function (
  GWFactions
) {
    _.forEach(model.galaxy.systems(), function (system, star) {
      ko.computed(function () {
        var ai = system.star.ai()
        if (!ai) return;
        var factionIndex = ai.faction
        var faction = GWFactions[factionIndex]
        // Ensures we load the faction colour to assign to a system instead of the minion colour
        var normalizedColor = _.map(faction.color[0], function (c) { return c / 255; });
        // test value
        // normalizedColor = [0, 1, 0]
        system.ownerColor(normalizedColor.concat(3));
        // dependencies. These will cause the base code that updates color to rerun, so we have to run under the same conditions, and pray we run later than that code.
        system.connected()
        model.cheats.noFog()
        system.star.hasCard()
      })
    })
  })