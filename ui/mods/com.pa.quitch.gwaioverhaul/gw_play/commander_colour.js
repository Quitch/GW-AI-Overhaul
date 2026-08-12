define(() => {
  const luminance = (colour) =>
    // Relative luminance approximation for RGB tuples.
    colour[0] * 0.2126 + colour[1] * 0.7152 + colour[2] * 0.0722;

  const contrastScore = (a, b) => {
    const dr = a[0] - b[0];
    const dg = a[1] - b[1];
    const db = a[2] - b[2];
    const rgbDistance = dr * dr + dg * dg + db * db;
    const luminanceDistance = Math.abs(luminance(a) - luminance(b));

    return rgbDistance + luminanceDistance * 16;
  };

  const sortByContrast = (colours) => {
    const remaining = colours.slice(0);
    const ordered = [];
    let i;

    if (remaining.length < 2) {
      return remaining;
    }

    // Start from the darkest colour, then repeatedly pick the most contrasting colour.
    let anchorIndex = 0;
    let minLuminance = luminance(remaining[0]);

    for (i = 1; i < remaining.length; i++) {
      const candidateLuminance = luminance(remaining[i]);
      if (candidateLuminance < minLuminance) {
        minLuminance = candidateLuminance;
        anchorIndex = i;
      }
    }

    ordered.push(remaining.splice(anchorIndex, 1)[0]);

    while (remaining.length > 0) {
      const last = ordered[ordered.length - 1];
      let bestIndex = 0;
      let bestScore = -1;

      for (i = 0; i < remaining.length; i++) {
        const candidateScore = contrastScore(last, remaining[i]);
        if (candidateScore > bestScore) {
          bestScore = candidateScore;
          bestIndex = i;
        }
      }

      ordered.push(remaining.splice(bestIndex, 1)[0]);
    }

    return ordered;
  };

  return {
    rgb: function (colour) {
      return `rgb(${colour[0][0]},${colour[0][1]},${colour[0][2]})`;
    },

    pick: function (faction, minionColour, count) {
      const legonisColours = [
        [0, 176, 255],
        [153, 204, 255],
        [102, 178, 255],
        [51, 153, 255],
        [0, 128, 255],
        [0, 102, 204],
        [204, 255, 255],
        [153, 255, 255],
        [102, 255, 255],
        [0, 204, 204],
        [0, 153, 153],
        [0, 76, 153],
        [0, 0, 225],
        [51, 51, 255],
        [0, 255, 255],
      ];
      const foundationColours = [
        [145, 87, 199],
        [229, 204, 255],
        [204, 153, 255],
        [178, 102, 255],
        [153, 51, 255],
        [127, 0, 255],
        [102, 0, 204],
        [255, 204, 255],
        [255, 153, 255],
        [255, 102, 255],
        [255, 0, 255],
        [204, 0, 204],
        [153, 0, 153],
        [255, 204, 229],
        [255, 153, 204],
        [255, 102, 178],
        [255, 51, 153],
      ];
      const synchronousColours = [
        [126, 226, 101],
        [204, 255, 153],
        [178, 255, 102],
        [128, 255, 0],
        [102, 204, 0],
        [76, 153, 0],
        [204, 255, 204],
        [153, 255, 153],
        [102, 255, 102],
        [0, 255, 0],
        [0, 204, 0],
        [0, 153, 0],
        [0, 102, 0],
        [0, 153, 76],
        [0, 204, 102],
        [0, 255, 128],
      ];
      const revenantsColours = [
        [255, 204, 204],
        [255, 153, 153],
        [255, 51, 51],
        [255, 0, 0],
        [153, 0, 0],
        [255, 102, 102],
        [255, 204, 153],
        [255, 178, 102],
        [255, 153, 51],
        [255, 128, 0],
        [204, 102, 0],
        [255, 255, 204],
        [255, 255, 153],
        [255, 255, 102],
        [204, 204, 0],
        [153, 153, 0],
      ];
      const clusterColours = [
        [128, 128, 128],
        [142, 107, 68],
        [166, 166, 166],
        [90, 90, 90],
        [70, 70, 70],
      ];
      const factions = [
        legonisColours,
        foundationColours,
        synchronousColours,
        revenantsColours,
        clusterColours,
      ];

      let i;
      for (i = 0; i < factions.length; i++) {
        factions[i] = sortByContrast(factions[i]);
      }

      if (count > factions[faction].length - 1) {
        // We ran out of colours
        return minionColour;
      }

      const guardianColour = [255, 255, 255];
      const secondaryColour = [192, 192, 192];

      if (_.isEqual(minionColour[0], guardianColour)) {
        return [guardianColour, secondaryColour];
      }
      return [factions[faction][count], secondaryColour];
    },
  };
});
