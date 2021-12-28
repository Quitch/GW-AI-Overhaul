define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Avenger Upgrade Tech replaces the orbital fighter's laser with an orbital battleship laser."
    ),
    summarize: _.constant("!LOC:Avenger Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function () {
      var chance = 0;
      if (
        gwaioCards.hasUnit(gwaioUnits.orbitalLauncher) &&
        gwaioCards.hasUnit(gwaioUnits.avenger)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.avenger,
          path: "tools",
          op: "replace",
          value: [
            {
              spec_id: gwaioUnits.omegaWeaponAO,
              aim_bone: "bone_body",
              record_index: 0,
              fire_event: "fired0",
              projectiles_per_fire: 1,
              muzzle_bone: "bone_recoil01",
            },
          ],
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
