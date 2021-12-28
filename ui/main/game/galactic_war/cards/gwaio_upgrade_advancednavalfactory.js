define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Naval Factory Upgrade Tech decreases advanced naval unit costs by 25% but also decreases the factory's health by 50%."
    ),
    summarize: _.constant("!LOC:Advanced Naval Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_sea",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function () {
      var chance = 0;
      if (gwaioCards.hasUnit(gwaioUnits.navalFactoryAdvanced)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var units = [
        gwaioUnits.navalFabberAdvanced,
        gwaioUnits.stingray,
        gwaioUnits.leviathan,
        gwaioUnits.kraken,
        gwaioUnits.kaiju,
        gwaioUnits.typhoon,
        gwaioUnits.squall,
      ];
      var mods = units.map(function (unit) {
        return {
          file: unit,
          path: "build_metal_cost",
          op: "multiply",
          value: 0.75,
        };
      });
      mods.push({
        file: gwaioUnits.navalFactoryAdvanced,
        path: "max_health",
        op: "multiply",
        value: 0.5,
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
