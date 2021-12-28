define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Laser Defense Tower Upgrade Tech increases the range of the turret by 25%."
    ),
    summarize: _.constant("!LOC:Laser Defense Tower Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        gwaioCards.hasUnit(gwaioUnits.laserDefenseTower) &&
        (gwaioCards.hasUnit(gwaioUnits.botFactory) ||
          gwaioCards.hasUnit(gwaioUnits.airFactory) ||
          gwaioCards.hasUnit(gwaioUnits.navalFactory) ||
          gwaioCards.hasUnit(gwaioUnits.vehicleFactory) ||
          inventory.hasCard("gwc_start_artillery") ||
          inventory.hasCard("nem_start_tower_rush"))
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.laserDefenseTowerWeapon,
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
