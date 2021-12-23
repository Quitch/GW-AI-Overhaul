define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Naval Ammunition Tech increases the damage of all naval vessels by 25%"
    ),
    summarize: _.constant("!LOC:Naval Ammunition Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function () {
      var chance = 0;
      chance = 35;

      return { chance: chance };
    },
    buff: function (inventory) {
      var ammos = [
        gwaioUnits.barracudaAmmo,
        gwaioUnits.leviathanAmmo,
        gwaioUnits.leviathanAmmo,
        gwaioUnits.orcaAmmo,
        gwaioUnits.orcaTorpedoAmmo,
        gwaioUnits.squallTorpedoAmmo,
        gwaioUnits.squallAmmo,
        gwaioUnits.narwhalAAAmmo,
        gwaioUnits.narwhalAmmo,
        gwaioUnits.narwhalTorpedoAmmo,
        gwaioUnits.kaijuSecondaryAmmo,
        gwaioUnits.kaijuAmmo,
        gwaioUnits.stingrayAAAmmo,
        gwaioUnits.stingrayAmmo,
        gwaioUnits.krakenMissileAmmo,
        gwaioUnits.krakenWeaponAmmo,
        gwaioUnits.piranhaAmmo,
      ];
      var mods = [];
      ammos.forEach(function (ammo) {
        mods.push({
          file: ammo,
          path: "damage",
          op: "multiply",
          value: 1.25,
        });
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
