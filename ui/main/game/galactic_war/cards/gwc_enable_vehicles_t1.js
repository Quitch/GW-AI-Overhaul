define(["shared/gw_common"], function (GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Basic Vehicle tech enables building of basic vehicle and basic vehicle factories. Basic vehicle factories are built via your commander or any basic fabricator."
    ),
    summarize: _.constant("!LOC:Basic Vehicle Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_vehicle",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        !(
          inventory.hasCard("gwc_enable_vehicles_all") ||
          inventory.hasCard("gwc_start_vehicle") ||
          inventory.hasCard("gwc_start_allfactory") ||
          inventory.hasCard("gwaio_start_hoarder")
        )
      ) {
        var dist = system.distance();
        if (dist > 0 && !inventory.hasCard("gwaio_start_hoarder")) {
          if (context.totalSize <= GW.balance.numberOfSystems[0]) {
            chance = 250;
            if (dist > 2) chance = 100;
          } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
            chance = 250;
            if (dist > 3) chance = 100;
          } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
            chance = 250;
            if (dist > 4) chance = 100;
          } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
            chance = 250;
            if (dist > 5) chance = 100;
          } else {
            chance = 250;
            if (dist > 6) chance = 100;
          }
        }
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits([
        "/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json",
        "/pa/units/land/attack_vehicle/attack_vehicle.json",
        "/pa/units/land/tank_armor/tank_armor.json",
        "/pa/units/land/tank_hover/tank_hover.json",
        "/pa/units/land/tank_light_laser/tank_light_laser.json",
        "/pa/units/land/vehicle_factory/vehicle_factory.json",
      ]);
    },
    dull: function () {},
  };
});
