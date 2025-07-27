define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoGroup, gwoUnit) {
  const prepareMods = function (mods) {
    const deathAmmo = [
      gwoUnit.wyrmDeath,
      gwoUnit.zeusDeath,
      gwoUnit.commanderDeath,
      gwoUnit.manhattanDeath,
      gwoUnit.atlasDeath,
      gwoUnit.aresDeath,
      gwoUnit.jigDeath,
      gwoUnit.kesslerAmmo,
      gwoUnit.landMineAmmo,
    ];
    _.forEach(deathAmmo, function (ammo) {
      mods.push({
        file: ammo,
        path: "splash_damages_allies",
        op: "replace",
        value: true,
      });
    });

    const unitsWithoutADeathWeapon = _.reject(gwoGroup.units, function (unit) {
      return _.includes(
        [
          gwoUnit.wyrm,
          gwoUnit.zeus,
          gwoUnit.commander,
          gwoUnit.manhattan,
          gwoUnit.atlas,
          gwoUnit.ares,
          gwoUnit.jig,
        ],
        unit
      );
    });
    _.forEach(unitsWithoutADeathWeapon, function (unit) {
      mods.push(
        {
          file: unit,
          path: "death_weapon.ground_ammo_spec",
          op: "replace",
          value: gwoUnit.kesslerAmmo,
        },
        {
          file: unit,
          path: "death_weapon.ground_ammo_spec",
          op: "tag",
          value: gwoUnit.kesslerAmmo,
        }
      );
    });
  };

  return {
    visible: _.constant(true),
    describe: _.constant("!LOC:All units explode on death."),
    summarize: _.constant("!LOC:Protocol: Kill-switch"),
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
