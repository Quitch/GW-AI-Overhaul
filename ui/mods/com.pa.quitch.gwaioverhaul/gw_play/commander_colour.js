define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/army_colours.js",
], function (armyColours) {
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

  // Keeps the first colour, the one nearest the faction colour, then
  // repeatedly picks the most contrasting colour.
  var sortByContrast = function (colours) {
    var remaining = colours.slice(1);
    var ordered = colours.slice(0, 1);
    var i;

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

  // Sorted once: the order depends only on the list.
  var factions = _.map(armyColours.factions, function (faction) {
    return {
      allies: sortByContrast(faction.allies),
      enemies: sortByContrast(faction.enemies),
      spent: faction.spent,
    };
  });

  var guardianColour = [255, 255, 255];
  var secondaryColour = [192, 192, 192];

  var pickFrom = function (side, faction, minionColour, count) {
    var isGuardian = _.isEqual(_.get(minionColour, 0), guardianColour);

    // An unknown faction has no palette, and keeps the caller's colour.
    var entry = factions[faction];
    if (!entry) {
      return minionColour;
    }

    var palette = entry[side];
    if (count > palette.length - 1) {
      // We ran out of colours
      return isGuardian ? minionColour : [entry.spent, secondaryColour];
    }

    if (isGuardian) {
      return [guardianColour, secondaryColour];
    }
    return [palette[count], secondaryColour];
  };

  var sizeOf = function (side, faction) {
    var entry = factions[faction];
    return entry ? entry[side].length : 0;
  };

  return {
    rgb: function (colour) {
      return (
        "rgb(" + colour[0][0] + "," + colour[0][1] + "," + colour[0][2] + ")"
      );
    },

    // The player's side: Sub Commanders, a star's ally, and co-op AI players.
    // Never a player colour, as the faction's players are in the battle.
    allySize: function (faction) {
      return sizeOf("allies", faction);
    },

    pickAlly: function (faction, minionColour, count) {
      return pickFrom("allies", faction, minionColour, count);
    },

    // An enemy faction's armies, which lead with its own player colours: no
    // player of an AI faction is ever in the battle.
    enemySize: function (faction) {
      return sizeOf("enemies", faction);
    },

    pickEnemy: function (faction, minionColour, count) {
      return pickFrom("enemies", faction, minionColour, count);
    },
  };
});
