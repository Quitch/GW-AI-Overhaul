define(function () {
  return {
    pick: function (faction, minionColour, count) {
      var legonisColours = [
        [0, 176, 255],
        [153, 204, 255],
        [102, 178, 255],
        [51, 153, 255],
        [0, 128, 255],
        [0, 102, 204],
        [0, 76, 204],
      ];
      var foundationColours = [
        [145, 87, 199],
        [229, 204, 255],
        [204, 153, 255],
        [178, 102, 255],
        [153, 51, 255],
        [127, 0, 255],
        [102, 0, 204],
      ];
      var synchronousColours = [
        [126, 226, 101],
        [229, 255, 204],
        [204, 255, 153],
        [178, 255, 102],
        [128, 255, 0],
        [102, 204, 0],
        [76, 153, 0],
      ];
      var revenantsColours = [
        [236, 34, 35],
        [255, 204, 204],
        [255, 153, 153],
        [255, 51, 51],
        [255, 0, 0],
        [204, 0, 0],
        [153, 0, 0],
      ];
      var clusterColours = [
        [128, 128, 128],
        [216, 216, 216],
        [187, 187, 187],
      ];
      var factions = [
        legonisColours,
        foundationColours,
        synchronousColours,
        revenantsColours,
        clusterColours,
      ];

      console.log(faction);
      console.log(minionColour);
      console.log(count);

      if (count > factions[faction].length - 1) {
        // We ran out of colours
        return minionColour;
      }
      return [factions[faction][count], [192, 192, 192]];
    },
  };
});
