define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Skitter Upgrade Tech adds a low powered laser to the land scout and increases its vision by 100%."
    ),
    summarize: _.constant("!LOC:Skitter Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwaioCards.hasUnit(inventory.units(), gwaioUnits.skitter)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.skitter,
          path: "tools",
          op: "replace",
          value: [
            {
              spec_id: gwaioUnits.skitterWeapon,
              aim_bone: "bone_root",
              muzzle_bone: "bone_root",
            },
          ],
        },
        {
          file: gwaioUnits.skitter,
          path: "command_caps",
          op: "push",
          value: "ORDER_Attack",
        },
        {
          file: gwaioUnits.skitter,
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 2,
        },
        {
          file: gwaioUnits.skitter,
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: 2,
        },
        {
          file: gwaioUnits.skitter,
          path: "recon.observer.items.2.radius",
          op: "multiply",
          value: 2,
        },
        {
          file: gwaioUnits.skitterAmmo,
          path: "initial_velocity",
          op: "multiply",
          value: 2,
        },
        {
          file: gwaioUnits.skitterAmmo,
          path: "max_velocity",
          op: "multiply",
          value: 2,
        },
        {
          file: gwaioUnits.skitterAmmo,
          path: "damage",
          op: "multiply",
          value: 2,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
