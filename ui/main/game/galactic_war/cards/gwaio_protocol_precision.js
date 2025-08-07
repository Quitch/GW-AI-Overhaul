define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  const prepareMods = function (mods) {
    const percentageReduction = 0.85;
    const percentageIncrease = 1.15;
    const mobileCombatUnits = _.xor(
      gwoGroup.combat,
      gwoGroup.structuresDefences
    );
    _.forEach(mobileCombatUnits, function (unit) {
      mods.push(
        {
          file: unit,
          path: "navigation.move_speed",
          op: "multiply",
          value: percentageReduction,
        },
        {
          file: unit,
          path: "navigation.brake",
          op: "multiply",
          value: percentageReduction,
        },
        {
          file: unit,
          path: "navigation.acceleration",
          op: "multiply",
          value: percentageReduction,
        },
        {
          file: unit,
          path: "navigation.turn_speed",
          op: "multiply",
          value: percentageReduction,
        }
      );
    });
    _.forEach(gwoGroup.combat, function (unit) {
      mods.push(
        {
          file: unit,
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: percentageIncrease,
        },
        {
          file: unit,
          path: "recon.observer.items.1.radius",
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
        value: percentageIncrease,
      });
    });
    // Try to make sure that units can use their full range
    _.forEach(gwoGroup.ammo, function (ammo) {
      mods.push(
        {
          file: ammo,
          path: "lifetime",
          op: "multiply",
          value: percentageIncrease,
        },
        {
          file: ammo,
          path: "max_velocity",
          op: "multiply",
          value: percentageIncrease,
        }
      );
    });
  };

  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:All combat units gain +15% sight and weapon range and -15% movement speed."
    ),
    summarize: _.constant("!LOC:Protocol: Precision"),
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
