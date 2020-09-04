define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:Defense Fabrication Tech reduces metal build costs of all defensive structures by 50%"
  ),
  summarize: _.constant("!LOC:Defense Fabrication Tech"),
  icon: _.constant(
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_turret.png"
  ),
  audio: function () {
    return {
      found: "/VO/Computer/gw/board_tech_available_cost_reduction",
    };
  },
  getContext: function (galaxy) {
    return {
      totalSize: galaxy.stars().length,
    };
  },
  deal: function () {
    var chance = 50;

    return { chance: chance };
  },
  buff: function (inventory) {
    var units = [
      "/pa/units/land/air_defense_adv/air_defense_adv.json",
      "/pa/units/land/air_defense/air_defense.json",
      "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher_ammo.json",
      "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher.json",
      "/pa/units/land/land_barrier/land_barrier.json",
      "/pa/units/land/land_mine/land_mine.json",
      "/pa/units/land/laser_defense_adv/laser_defense_adv.json",
      "/pa/units/land/laser_defense_single/laser_defense_single.json",
      "/pa/units/land/laser_defense/laser_defense.json",
      "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json",
      "/pa/units/orbital/defense_satellite/defense_satellite.json",
      "/pa/units/orbital/ion_defense/ion_defense.json",
      "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
      "/pa/units/sea/torpedo_launcher/torpedo_launcher.json",
    ];
    var mods = [];
    var modUnit = function (unit) {
      mods.push({
        file: unit,
        path: "build_metal_cost",
        op: "multiply",
        value: 0.5,
      });
    };
    _.forEach(units, modUnit);
    inventory.addMods(mods);
  },
  dull: function () {},
});
