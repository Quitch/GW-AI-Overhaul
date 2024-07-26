define({
  rgb: function (colour) {
    return (
      "rgb(" + colour[0][0] + "," + colour[0][1] + "," + colour[0][2] + ")"
    );
  },

  pick: function (faction, minionColour, count) {
    const legonisColours = [
      [0, 176, 255],
      [153, 204, 255],
      [102, 178, 255],
      [51, 153, 255],
      [0, 128, 255],
      [0, 102, 204],
      [0, 76, 204],
    ];
    const foundationColours = [
      [145, 87, 199],
      [229, 204, 255],
      [204, 153, 255],
      [178, 102, 255],
      [153, 51, 255],
      [127, 0, 255],
      [102, 0, 204],
    ];
    const synchronousColours = [
      [126, 226, 101],
      [229, 255, 204],
      [204, 255, 153],
      [178, 255, 102],
      [128, 255, 0],
      [102, 204, 0],
      [76, 153, 0],
    ];
    const revenantsColours = [
      [236, 34, 35],
      [255, 204, 204],
      [255, 153, 153],
      [255, 51, 51],
      [255, 0, 0],
      [204, 0, 0],
      [153, 0, 0],
    ];
    const clusterColours = [
      [128, 128, 128],
      [166, 166, 166],
      [90, 90, 90],
    ];
    const factions = [
      legonisColours,
      foundationColours,
      synchronousColours,
      revenantsColours,
      clusterColours,
    ];

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
});
