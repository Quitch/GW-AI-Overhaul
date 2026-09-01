// The pure decisions a race picker makes, shared by gw_start and the co-op
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

  // Returns undefined for an achromatic colour, which has no hue to rotate to.
  var rgbHue = function (rgb) {
    var red = rgb[0] / 255;
    var green = rgb[1] / 255;
    var blue = rgb[2] / 255;
    var max = Math.max(red, green, blue);
    var delta = max - Math.min(red, green, blue);

    if (delta === 0) {
      return undefined;
    }

    var hue;
    if (max === red) {
      hue = ((green - blue) / delta) % 6;
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }

    hue = hue * 60;
    return hue < 0 ? hue + 360 : hue;
  };

  // The CSS filter that paints a commander portrait in a faction colour. The
  // art ships in one team paint (artHue, the race's commanderArtHue), so
  // rotating by the difference recolours it while keeping the model's
  // shading. No colour gives no filter.
  var commanderTint = function (rgb, artHue) {
    if (!_.isArray(rgb) || rgb.length < 3) {
      return "";
    }

    var hue = rgbHue(rgb);

    // Cluster's colour is a neutral grey, so drain the art's colour rather
    // than rotating a hue it doesn't have.
    if (hue === undefined) {
      return "grayscale(1)";
    }

    return "hue-rotate(" + Math.round(hue - artHue) + "deg)";
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = {
      optionsHtml: optionsHtml,
      commanderChoices: commanderChoices,
      commanderTint: commanderTint,
    };
  }

  return {
    optionsHtml: optionsHtml,
    commanderChoices: commanderChoices,
    commanderTint: commanderTint,
  };
});
