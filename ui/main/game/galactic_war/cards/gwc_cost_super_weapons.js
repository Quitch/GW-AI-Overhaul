define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Super Weapon Fabrication Tech reduces metal build costs of all nuclear missiles, Halley Rockets, and metal planet control modules by 75%. Tech to build super weapons is required."
    ),
    summarize: _.constant("!LOC:Super Weapon Fabrication Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_super_weapons.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_cost_reduction",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoGroup.structuresSuperWeapons)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var units = gwoGroup.structuresSuperWeapons.concat(
        gwoUnit.nukeLauncherAmmo
      );
      var mods = _.map(units, function (unit) {
        return {
          file: unit,
          path: "build_metal_cost",
          op: "multiply",
          value: 0.25,
        };
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
