define(function () {
  var luminance = function (colour) {
    // Relative luminance approximation for RGB tuples.
    return colour[0] * 0.2126 + colour[1] * 0.7152 + colour[2] * 0.0722;
  };

  var contrastScore = function (a, b) {
    var dr = a[0] - b[0];
    var dg = a[1] - b[1];
    var db = a[2] - b[2];
    var rgbDistance = dr * dr + dg * dg + db * db;
    var luminanceDistance = Math.abs(luminance(a) - luminance(b));

    return rgbDistance + luminanceDistance * 16;
  };

  var sortByContrast = function (colours) {
    var remaining = colours.slice(0);
    var ordered = [];
    var i;

    if (remaining.length < 2) {
      return remaining;
    }

    // Start from the darkest colour, then repeatedly pick the most contrasting colour.
    var anchorIndex = 0;
    var minLuminance = luminance(remaining[0]);

    for (i = 1; i < remaining.length; i++) {
      var candidateLuminance = luminance(remaining[i]);
      if (candidateLuminance < minLuminance) {
        minLuminance = candidateLuminance;
        anchorIndex = i;
      }
    }

    ordered.push(remaining.splice(anchorIndex, 1)[0]);

    while (remaining.length > 0) {
      var last = ordered[ordered.length - 1];
      var bestIndex = 0;
      var bestScore = -1;

      for (i = 0; i < remaining.length; i++) {
        var candidateScore = contrastScore(last, remaining[i]);
        if (candidateScore > bestScore) {
          bestScore = candidateScore;
          bestIndex = i;
        }
      }

      ordered.push(remaining.splice(bestIndex, 1)[0]);
    }

    return ordered;
  };

  var legonisColours = [
    [153, 204, 255],
    [102, 178, 255],
    [51, 153, 255],
    [0, 128, 255],
    [0, 99, 195],
    [219, 255, 255],
    [153, 255, 255],
    [102, 255, 255],
    [0, 201, 201],
    [0, 159, 150],
    [0, 76, 153],
    [0, 0, 225],
    [51, 51, 255],
    [0, 255, 255],
  ];
  var foundationColours = [
    [229, 204, 255],
    [204, 153, 255],
    [178, 102, 255],
    [150, 57, 255],
    [127, 0, 255],
    [102, 0, 207],
    [255, 204, 255],
    [255, 144, 255],
    [255, 102, 255],
    [255, 0, 255],
    [204, 0, 204],
    [153, 0, 153],
    [255, 204, 229],
    [255, 153, 204],
    [255, 102, 178],
    [255, 51, 153],
  ];
  var synchronousColours = [
    [204, 255, 153],
    [178, 255, 102],
    [153, 255, 9],
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
  var revenantsColours = [
    [255, 204, 204],
    [255, 153, 153],
    [255, 51, 51],
    [255, 0, 0],
    [165, 0, 6],
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
  var clusterColours = [
    [12, 12, 12],
    [35, 35, 35],
    [30, 40, 90],
    [245, 240, 230],
    [245, 220, 170],
    [40, 52, 64],
    [70, 100, 130],
    [140, 185, 195],
    [60, 40, 30],
    [100, 15, 10],
    [101, 67, 33],
    [130, 70, 40],
    [160, 82, 45],
    [180, 130, 90],
    [196, 164, 132],
    [205, 190, 160],
  ];

  // Sorted once: the order depends only on the palette. A spent palette
  // gives its own colour, as a minion's own colour is the player army's.
  var factions = _.map(
    [
      { colours: legonisColours, spent: [30, 60, 120] },
      { colours: foundationColours, spent: [80, 30, 110] },
      { colours: synchronousColours, spent: [30, 70, 40] },
      { colours: revenantsColours, spent: [100, 20, 30] },
      { colours: clusterColours, spent: [145, 145, 150] },
    ],
    function (faction) {
      return { palette: sortByContrast(faction.colours), spent: faction.spent };
    }
  );

  return {
    rgb: function (colour) {
      return (
        "rgb(" + colour[0][0] + "," + colour[0][1] + "," + colour[0][2] + ")"
      );
    },

    paletteSize: function (faction) {
      var entry = factions[faction];
      return entry ? entry.palette.length : 0;
    },

    pick: function (faction, minionColour, count) {
      var guardianColour = [255, 255, 255];
      var secondaryColour = [192, 192, 192];
      var isGuardian = _.isEqual(_.get(minionColour, 0), guardianColour);

      // An unknown faction has no palette, and keeps the caller's colour.
      var entry = factions[faction];
      if (!entry) {
        return minionColour;
      }

      if (count > entry.palette.length - 1) {
        // We ran out of colours
        return isGuardian ? minionColour : [entry.spent, secondaryColour];
      }

      if (isGuardian) {
        return [guardianColour, secondaryColour];
      }
      return [entry.palette[count], secondaryColour];
    },
  };
});
