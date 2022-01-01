define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Narwhal Upgrade Tech doubles the rate of fire of all weapons."
    ),
    summarize: _.constant("!LOC:Narwhal Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png"
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
        gwaioCards.hasUnit(gwaioUnits.navalFactory) &&
        gwaioCards.hasUnit(gwaioUnits.narwhal)
      ) {
        chance = 30;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.narwhalWeapon,
          path: "rate_of_fire",
          op: "multiple",
          value: 2,
        },
        {
          file: gwaioUnits.narwhalWeaponAA,
          path: "rate_of_fire",
          op: "multiple",
          value: 2,
        },
        {
          file: gwaioUnits.narwhalTorpedo,
          path: "rate_of_fire",
          op: "multiple",
          value: 2,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
