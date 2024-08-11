define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Stryker Upgrade Tech adds the ability for the attack vehicle to attack through self-destructing."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Stryker Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.stryker)) {
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
          file: gwoUnit.stryker,
          path: "tools",
          op: "prepend",
          value: {
            spec_id: "/pa/units/land/bot_bomb/bot_bomb_tool_weapon.json",
            aim_bone: "bone_root",
            muzzle_bone: "bone_root",
          },
        },
        {
          file: gwoUnit.stryker,
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_SelfDestruct",
        },
      ]);
    },
    dull: function () {},
  };
});
