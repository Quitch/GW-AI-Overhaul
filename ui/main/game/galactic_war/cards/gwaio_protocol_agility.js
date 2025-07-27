define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  const prepareMods = function (mods) {
    const percentageReduction = 0.8;
    const percentageIncrease = 1.2;
    _.forEach(gwoGroup.combat, function (unit) {
      mods.push(
        {
          file: unit,
          path: "navigation.move_speed",
          op: "multiply",
          value: percentageIncrease,
        },
        {
          file: unit,
          path: "navigation.brake",
          op: "multiply",
          value: percentageIncrease,
        },
        {
          file: unit,
          path: "navigation.acceleration",
          op: "multiply",
          value: percentageIncrease,
        },
        {
          file: unit,
          path: "navigation.turn_speed",
          op: "multiply",
          value: percentageIncrease,
        },
        {
          file: unit,
          path: "max_health",
          op: "multiply",
          value: percentageReduction,
        }
      );
    });
  };

  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:All combat units gain +20% movement speed and -20% health."
    ),
    summarize: _.constant("!LOC:Protocol: Agility"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwoCard.getContext,
    deal: function () {
      return { chance: 50 };
    },
    buff: function (inventory) {
      const mods = [];
      prepareMods(mods);
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
