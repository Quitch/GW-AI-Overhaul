define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Mine Upgrade Tech allows mines to explode without self-destructing."
    ),
    summarize: _.constant("!LOC:Mine Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png"
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
        gwaioCards.hasUnit(gwaioUnits.landMine) &&
        (gwaioCards.hasUnit(gwaioUnits.barnacle) ||
          gwaioCards.hasUnit(gwaioUnits.stitch) ||
          gwaioCards.hasUnit(gwaioUnits.botFactoryAdvanced))
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.landMineWeapon,
          path: "self_destruct",
          op: "replace",
          value: false,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
