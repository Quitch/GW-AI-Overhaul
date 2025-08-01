define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Leviathan Upgrade Tech replaces the battleship's cannons with Holkins advanced artillery."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Leviathan Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.leviathan)) {
        chance = 30;
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
          file: gwoUnit.leviathan,
          path: "tools.0.spec_id",
          op: "replace",
          value: gwoUnit.holkinsWeapon,
        },
        {
          file: gwoUnit.leviathan,
          path: "tools.0.projectiles_per_fire",
          op: "replace",
          value: 1,
        },
        {
          file: gwoUnit.leviathan,
          path: "tools.1.spec_id",
          op: "replace",
          value: gwoUnit.holkinsWeapon,
        },
        {
          file: gwoUnit.leviathan,
          path: "tools.1.projectiles_per_fire",
          op: "replace",
          value: 1,
        },
        {
          file: gwoUnit.leviathan,
          path: "tools.2.spec_id",
          op: "replace",
          value: gwoUnit.holkinsWeapon,
        },
        {
          file: gwoUnit.leviathan,
          path: "tools.2.projectiles_per_fire",
          op: "replace",
          value: 1,
        },
        {
          file: gwoUnit.leviathan,
          path: "tools.3.spec_id",
          op: "replace",
          value: gwoUnit.holkinsWeapon,
        },
        {
          file: gwoUnit.leviathan,
          path: "tools.3.projectiles_per_fire",
          op: "replace",
          value: 1,
        },
      ]);
    },
    dull: function () {},
  };
});
