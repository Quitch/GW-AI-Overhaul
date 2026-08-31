// The two pure decisions a race picker makes, shared by gw_start and the co-op
// loadout scene. See races.md.
define(function () {
  // A <select>'s options for a race list.
  var optionsHtml = function (raceList) {
    return _.map(raceList, function (race) {
      return (
        '<option value="' +
        race.id +
        '">' +
        _.escape(loc(race.name)) +
        "</option>"
      );
    }).join("");
  };

  // The commanders a player picks from: a race's own where it has any, and the
  // scene's stock list otherwise.
  var commanderChoices = function (race, stock, mlaId) {
    return race && race.id !== mlaId && race.commanders.length
      ? _.pluck(race.commanders, "spec")
      : stock;
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = {
      optionsHtml: optionsHtml,
      commanderChoices: commanderChoices,
    };
  }

  return { optionsHtml: optionsHtml, commanderChoices: commanderChoices };
});
