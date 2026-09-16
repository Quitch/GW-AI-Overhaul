// The pure decisions a race picker makes, shared by gw_start and the co-op
// loadout scene. See races.md.
define(() => {
  // A <select>'s options for a race list.
  const optionsHtml = (raceList) =>
    _.map(
      raceList,
      (race) =>
        `<option value="${race.id}">${_.escape(loc(race.name))}</option>`,
    ).join("");

  // The commanders a player picks from: a race's own where it has any, and the
  // scene's stock list otherwise.
  const commanderChoices = (race, stock, mlaId) =>
    race && race.id !== mlaId && race.commanders.length
      ? _.map(race.commanders, "spec")
      : stock;

  // Returns undefined for an achromatic colour, which has no hue to rotate to.
  const rgbHue = (rgb) => {
    const red = rgb[0] / 255;
    const green = rgb[1] / 255;
    const blue = rgb[2] / 255;
    const max = Math.max(red, green, blue);
    const delta = max - Math.min(red, green, blue);

    if (delta === 0) {
      return undefined;
    }

    let hue;
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
  const commanderTint = (rgb, artHue) => {
    if (!Array.isArray(rgb) || rgb.length < 3) {
      return "";
    }

    const hue = rgbHue(rgb);

    // Cluster's colour is a neutral grey, so drain the art's colour rather
    // than rotating a hue it doesn't have.
    if (hue === undefined) {
      return "grayscale(1)";
    }

    return `hue-rotate(${Math.round(hue - artHue)}deg)`;
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = {
      optionsHtml,
      commanderChoices,
      commanderTint,
    };
  }

  return {
    optionsHtml,
    commanderChoices,
    commanderTint,
  };
});
