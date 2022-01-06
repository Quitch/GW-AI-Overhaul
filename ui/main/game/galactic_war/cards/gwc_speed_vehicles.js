define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwaioCards, gwaioGroups) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Vehicle Engine Tech increases speed of all vehicles by 50%"
    ),
    summarize: _.constant("!LOC:Vehicle Engine Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_speed",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        inventory.hasCard("gwc_enable_vehicles_t1") ||
        inventory.hasCard("gwc_enable_vehicles_all") ||
        inventory.hasCard("gwc_start_vehicle") ||
        inventory.hasCard("gwaio_start_hoarder")
      ) {
        chance = 70;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var units = gwaioGroups.vehiclesMobile;
      var mods = [];
      units.forEach(function (unit) {
        mods.push(
          {
            file: unit,
            path: "navigation.move_speed",
            op: "multiply",
            value: 1.5,
          },
          {
            file: unit,
            path: "navigation.brake",
            op: "multiply",
            value: 1.5,
          },
          {
            file: unit,
            path: "navigation.acceleration",
            op: "multiply",
            value: 1.5,
          },
          {
            file: unit,
            path: "navigation.turn_speed",
            op: "multiply",
            value: 1.5,
          }
        );
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
