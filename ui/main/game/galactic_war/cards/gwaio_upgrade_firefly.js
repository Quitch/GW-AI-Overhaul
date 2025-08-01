define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Firefly Upgrade Tech adds a low powered laser to the air scout and increases its vision by 100%."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
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
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.firefly)) {
        chance = 60;
      }
      return {
        params: {
          allowOverflow: true,
        },
        chance: chance,
      };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.firefly,
          path: "tools",
          op: "replace",
          value: [
            {
              spec_id: gwoUnit.fireflyWeapon,
              aim_bone: "bone_root",
              muzzle_bone: "bone_root",
            },
          ],
        },
        {
          file: gwoUnit.firefly,
          path: "tools.0.spec_id",
          op: "tag",
        },
        {
          file: gwoUnit.firefly,
          path: "command_caps",
          op: "push",
          value: "ORDER_Attack",
        },
        {
          file: gwoUnit.firefly,
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 2,
        },
        {
          file: gwoUnit.firefly,
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: 2,
        },
        {
          file: gwoUnit.fireflyAmmo,
          path: "damage",
          op: "multiply",
          value: 3.34,
        },
      ]);
    },
    dull: function () {},
  };
});
