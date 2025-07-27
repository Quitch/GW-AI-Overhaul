define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoGroup, gwoUnit) {
  const prepareMods = function (mods) {
    const unitsWithADeathWeapon = [
      gwoUnit.wyrm,
      gwoUnit.zeus,
      gwoUnit.commander,
      gwoUnit.manhattan,
      gwoUnit.ares,
      gwoUnit.atlas,
      gwoUnit.jig,
    ];
    const unitsWithoutADeathWeapon = _.reject(gwoGroup.units, function (unit) {
      return _.includes(unitsWithADeathWeapon, unit);
    });
    _.forEach(unitsWithoutADeathWeapon, function (unit) {
      mods.push({
        file: unit,
        path: "death_weapon",
        op: "replace",
        value: {
          // TODO: replace with a custom explosion weapon
          ground_ammo_spec:
            "/pa/units/orbital/mining_platform/mining_platform_nuke.json",
        },
      });
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
