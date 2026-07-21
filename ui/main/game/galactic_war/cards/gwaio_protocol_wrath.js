define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  var prepareMods = function (mods) {
    var percentageReduction = 0.9;
    var percentageIncrease = 1.2;
    _.forEach(gwoGroup.combat, function (unit) {
      mods.push(
        {
          file: unit,
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: percentageReduction,
        },
        // Most units don't have this so expect to see warnings from the referee in console
        {
          file: unit,
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: percentageReduction,
        }
      );
    });
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
        }
      );
    });
    _.forEach(gwoGroup.weapons, function (weapon) {
      mods.push({
        file: weapon,
        path: "max_range",
        op: "multiply",
        value: percentageReduction,
      });
    });
  };

  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:All combat units gain +20% movement speed and -10% sight and weapon range."
    ),
    summarize: _.constant("!LOC:Protocol: Wrath"),
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
      var mods = [];
      prepareMods(mods);
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
