define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoGroup, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Structure Engine Tech increases the speed of all mobile structures by 50%"
    ),
    summarize: _.constant("!LOC:Structure Engine Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_structure.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_speed",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (inventory.hasCard("gwaio_start_nomad")) {
        chance = 70;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      const mobileStructures = gwoGroup.structuresDefences.concat(
        gwoGroup.structuresIntel,
        gwoGroup.structuresArtillery,
        gwoGroup.structuresEcoStorage,
        gwoUnit.energyPlant,
        gwoUnit.energyPlantAdvanced,
        gwoUnit.jig
      );

      const mods = _.flatten(
        _.map(mobileStructures, function (unit) {
          return [
            {
              file: unit,
              path: "navigation.move_speed",
              op: "multiply",
              value: 1.5,
            },
            {
              file: unit,
              path: "navigation.brake",
              op: "multiply",
              value: 1.5,
            },
            {
              file: unit,
              path: "navigation.acceleration",
              op: "multiply",
              value: 1.5,
            },
            {
              file: unit,
              path: "navigation.turn_speed",
              op: "multiply",
              value: 1.5,
            },
          ];
        })
      );
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
