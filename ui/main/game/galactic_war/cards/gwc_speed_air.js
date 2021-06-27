define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:Air Engine Tech increases the speed of all air units by 25%"
  ),
  summarize: _.constant("!LOC:Air Engine Tech"),
  icon: _.constant(
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_air_engine.png"
  ),
  audio: function () {
    return {
      found: "/VO/Computer/gw/board_tech_available_speed",
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
      inventory.hasCard("gwc_enable_air_t1") ||
      inventory.hasCard("gwc_enable_air_all") ||
      inventory.hasCard("gwc_start_air") ||
      inventory.hasCard("gwaio_start_hoarder")
    )
      chance = 70;

    return { chance: chance };
  },
  buff: function (inventory) {
    var units = [
      "/pa/units/air/air_scout/air_scout.json",
      "/pa/units/air/bomber_adv/bomber_adv.json",
      "/pa/units/air/bomber_heavy/bomber_heavy.json",
      "/pa/units/air/bomber/bomber.json",
      "/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv.json",
      "/pa/units/air/fabrication_aircraft/fabrication_aircraft.json",
      "/pa/units/air/fighter_adv/fighter_adv.json",
      "/pa/units/air/fighter/fighter.json",
      "/pa/units/air/gunship/gunship.json",
      "/pa/units/air/solar_drone/solar_drone.json",
      "/pa/units/air/strafer/strafer.json",
      "/pa/units/air/support_platform/support_platform.json",
      "/pa/units/air/transport/transport.json",
    ];
    var mods = [];
    var modUnit = function (unit) {
      mods.push({
        file: unit,
        path: "navigation.move_speed",
        op: "multiply",
        value: 1.25,
      });
      mods.push({
        file: unit,
        path: "navigation.brake",
        op: "multiply",
        value: 1.25,
      });
      mods.push({
        file: unit,
        path: "navigation.acceleration",
        op: "multiply",
        value: 1.25,
      });
      mods.push({
        file: unit,
        path: "navigation.turn_speed",
        op: "multiply",
        value: 1.25,
      });
    };
    _.forEach(units, modUnit);
    inventory.addMods(mods);
  },
  dull: function () {},
});
