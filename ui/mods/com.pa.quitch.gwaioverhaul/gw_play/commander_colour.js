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

define({
  rgb: function (colour) {
    return (
      "rgb(" + colour[0][0] + "," + colour[0][1] + "," + colour[0][2] + ")"
    );
  },

  pick: function (faction, minionColour, count) {
    var legonisColours = [
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
    var foundationColours = [
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
    var synchronousColours = [
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
    var revenantsColours = [
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
    var clusterColours = [
      [128, 128, 128],
      [142, 107, 68],
      [166, 166, 166],
      [90, 90, 90],
      [70, 70, 70],
    ];
    var factions = [
      legonisColours,
      foundationColours,
      synchronousColours,
      revenantsColours,
      clusterColours,
    ];

    var i;
    for (i = 0; i < factions.length; i++) {
      factions[i] = sortByContrast(factions[i]);
    }

    if (count > factions[faction].length - 1) {
      // We ran out of colours
      return minionColour;
    }

    var guardianColour = [255, 255, 255];
    var secondaryColour = [192, 192, 192];

    if (_.isEqual(minionColour[0], guardianColour)) {
      return [guardianColour, secondaryColour];
    }
    return [factions[faction][count], secondaryColour];
  },
});
