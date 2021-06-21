define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:Air Combat Tech increases the speed of all air units by 25%, health by 50%, and damage by 25%"
  ),
  summarize: _.constant("!LOC:Air Combat Tech"),
  icon: _.constant(
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
  ),
  audio: function () {
    return {
      found: "PA/VO/Computer/gw/board_tech_available_combat",
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
      chance = 60;
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
    units.forEach(function (unit) {
      mods.push(
        {
          file: unit,
          path: "navigation.move_speed",
          op: "multiply",
          value: 1.25,
        },
        {
          file: unit,
          path: "navigation.brake",
          op: "multiply",
          value: 1.25,
        },
        {
          file: unit,
          path: "navigation.acceleration",
          op: "multiply",
          value: 1.25,
        },
        {
          file: unit,
          path: "navigation.turn_speed",
          op: "multiply",
          value: 1.25,
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
      "/pa/units/air/air_scout/air_scout_ammo.json",
      "/pa/units/air/bomber_adv/bomber_adv_ammo.json",
      "/pa/units/air/bomber_heavy/bomber_heavy_ammo.json",
      "/pa/units/air/bomber/bomber_ammo.json",
      "/pa/units/air/fighter_adv/fighter_adv_ammo.json",
      "/pa/units/air/fighter/fighter_ammo.json",
      "/pa/units/air/gunship/gunship_ammo.json",
      "/pa/units/air/solar_drone/solar_drone_ammo.json",
      "/pa/units/air/strafer/strafer_ammo.json",
    ];
    ammos.forEach(function (ammo) {
      mods.push({
        file: ammo,
        path: "damage",
        op: "multiply",
        value: 1.25,
      });
    });
    inventory.addMods(mods);
  },
  dull: function () {},
});
