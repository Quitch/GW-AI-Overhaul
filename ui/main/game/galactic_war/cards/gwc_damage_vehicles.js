define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwaioCards, gwaioGroups) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Vehicle Ammunition Tech increases damage of all vehicles by 25%"
    ),
    summarize: _.constant("!LOC:Vehicle Ammunition Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwaioCards.hasUnit(inventory.units(), gwaioGroups.vehiclesMobile)) {
        chance = 70;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = _.map(gwaioGroups.vehiclesAmmo, function (unit) {
        return {
          file: unit,
          path: "damage",
          op: "multiply",
          value: 1.25,
        };
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
