define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Firefly Upgrade Tech adds a low powered laser to the air scout and increases its vision by 100%."
    ),
    summarize: _.constant("!LOC:Firefly Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwaioCards.hasUnit(inventory.units(), gwaioUnits.firefly)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.firefly,
          path: "tools",
          op: "replace",
          value: [
            {
              spec_id: gwaioUnits.fireflyWeapon,
              aim_bone: "bone_root",
              muzzle_bone: "bone_root",
            },
          ],
        },
        {
          file: gwaioUnits.firefly,
          path: "command_caps",
          op: "push",
          value: "ORDER_Attack",
        },
        {
          file: gwaioUnits.firefly,
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 2,
        },
        {
          file: gwaioUnits.firefly,
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: 2,
        },
        {
          file: gwaioUnits.fireflyAmmo,
          path: "damage",
          op: "multiply",
          value: 3.34,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
