define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Anchor Upgrade Tech increases the range of the defense satellite's weapons by 25%."
    ),
    summarize: _.constant("!LOC:Anchor Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_defense_upgrade.png"
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
        gwaioCards.hasUnit(gwaioUnits.orbitalFabber) &&
        gwaioCards.hasUnit(gwaioUnits.anchor)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.anchorWeaponAG,
          path: "max_range",
          op: "multiply",
          value: 1.25,
        },
        {
          file: gwaioUnits.anchorWeaponAO,
          path: "max_range",
          op: "multiply",
          value: 1.25,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
