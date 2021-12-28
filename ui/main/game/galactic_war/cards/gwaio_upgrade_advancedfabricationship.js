define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Fabrication Ship Upgrade Tech changes the advanced naval fabricator into a hover unit, allowing it to cross land and lava."
    ),
    summarize: _.constant("!LOC:Advanced Fabrication Ship Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_sea",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function () {
      var chance = 0;
      if (
        gwaioCards.hasUnit(gwaioUnits.navalFactoryAdvanced) &&
        gwaioCards.hasUnit(gwaioUnits.navalFabberAdvanced)
      ) {
        chance = 30;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.navalFabberAdvanced,
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_Hover",
        },
        {
          file: gwaioUnits.navalFabberAdvanced,
          path: "navigation.type",
          op: "replace",
          value: "hover",
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
