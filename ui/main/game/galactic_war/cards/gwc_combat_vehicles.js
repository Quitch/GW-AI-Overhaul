define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwaioFunctions, gwaioUnits, gwaioGroups) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Vehicle Combat Tech increases speed of all vehicles by 50%, health by 50%, and damage by 25%"
    ),
    summarize: _.constant("!LOC:Vehicle Combat Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: function () {
      return {
        found: "PA/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        inventory.hasCard("gwc_enable_vehicles_t1") ||
        inventory.hasCard("gwc_enable_vehicles_all") ||
        inventory.hasCard("gwc_start_vehicle") ||
        inventory.hasCard("gwaio_start_hoarder")
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var units = gwaioGroups.mobileVehicles;
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
          },
          {
            file: unit,
            path: "max_health",
            op: "multiply",
            value: 1.5,
          }
        );
      });
      var ammos = [
        gwaioUnits.spinnerAmmo,
        gwaioUnits.skitterAmmo,
        gwaioUnits.skitterAmmo,
        gwaioUnits.infernoAmmo,
        gwaioUnits.stormAmmo,
        gwaioUnits.vanguardAmmo,
        gwaioUnits.drifterAmmo,
        gwaioUnits.levelerAmmo,
        gwaioUnits.antAmmo,
      ];
      var modAmmo = function (ammo) {
        mods.push({
          file: ammo,
          path: "damage",
          op: "multiply",
          value: 1.25,
        });
      };
      _.forEach(ammos, modAmmo);
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
