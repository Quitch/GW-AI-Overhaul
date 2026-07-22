define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  var prepareMods = function (mods) {
    var percentageReduction = 0.8;
    var percentageIncrease = 1.2;
    _.forEach(gwoGroup.combatMobile, function (unit) {
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
    _.forEach(gwoGroup.combat, function (unit) {
      mods.push({
        file: unit,
        path: "max_health",
        op: "multiply",
        value: percentageReduction,
      });
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
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
    getContext: gwoCard.getContext,
    deal: function () {
      return { chance: 50 };
    },
    buff: function (inventory) {
      var mods = [];
      prepareMods(mods);
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
