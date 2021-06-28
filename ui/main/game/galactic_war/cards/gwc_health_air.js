define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:Air Armor Tech increases the health of all air units by 50%"
  ),
  summarize: _.constant("!LOC:Air Armor Tech"),
  icon: _.constant(
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
  ),
  audio: function () {
    return {
      found: "/VO/Computer/gw/board_tech_available_armor",
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
        path: "max_health",
        op: "multiply",
        value: 1.5,
      });
    };
    _.forEach(units, modUnit);
    inventory.addMods(mods);
  },
  dull: function () {},
});
