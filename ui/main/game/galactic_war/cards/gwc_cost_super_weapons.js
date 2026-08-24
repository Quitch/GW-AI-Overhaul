define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Super Weapon Fabrication Tech reduces metal build costs of all nuclear missiles, Halley Rockets, and metal planet control modules by 75%. Tech to build super weapons is required."
    ),
    summarize: _.constant("!LOC:Super Weapon Fabrication Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_super_weapons.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_cost_reduction",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var sizes = GW.balance.numberOfSystems;
      if (
        gwoCard.missingAllUnits(
          inventory.units(),
          gwoGroup.structuresSuperWeapons
        )
      ) {
        return { chance: 0 };
      }
      if (gwoCard.travelledFar(system, context, sizes)) {
        return { chance: 60 };
      }
      return {
        chance: gwoCard.travelledModerate(system, context, sizes) ? 30 : 15,
      };
    },
    buff: function (inventory) {
      var units = _.without(
        gwoGroup.structuresSuperWeapons,
        gwoUnit.nukeLauncher
      ).concat(gwoUnit.nukeLauncherAmmo);
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
    dull: function () {},
  };
});
