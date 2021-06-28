define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:Advanced Defense Technology enables more powerful defenses. Advanced defenses are built via advanced fabricators. Advanced defenses include tactical missile launchers, triple barrel laser turrets, and anti-air flak towers."
  ),
  summarize: _.constant("!LOC:Advanced Defense Technology"),
  icon: _.constant(
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_defense.png"
  ),
  audio: function () {
    return {
      found: "/VO/Computer/gw/board_tech_available_defence",
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
      inventory.hasCard("gwc_enable_vehicles_all") ||
      inventory.hasCard("gwc_enable_bots_all") ||
      inventory.hasCard("gwc_enable_air_all") ||
      inventory.hasCard("gwaio_start_hoarder")
    )
      chance = 100;
    return { chance: chance };
  },
  buff: function (inventory) {
    inventory.addUnits([
      "/pa/units/land/air_defense_adv/air_defense_adv.json",
      "/pa/units/land/laser_defense_adv/laser_defense_adv.json",
      "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json",
      "/pa/units/orbital/defense_satellite/defense_satellite.json",
      "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
    ]);
  },
  dull: function () {},
});
