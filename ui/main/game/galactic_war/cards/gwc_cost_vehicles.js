define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:Vehicle Fabrication Tech reduces metal build costs of all vehicles by 25%"
  ),
  summarize: _.constant("!LOC:Vehicle Fabrication Tech"),
  icon: _.constant(
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
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
  deal: function (system, context, inventory) {
    var chance = 0;
    if (
      inventory.hasCard("gwc_enable_vehicles_t1") ||
      inventory.hasCard("gwc_enable_vehicles_all") ||
      inventory.hasCard("gwc_start_vehicle") ||
      inventory.hasCard("gwaio_start_hoarder")
    )
      chance = 80;

    return { chance: chance };
  },
  buff: function (inventory) {
    var units = [
      "/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json",
      "/pa/units/land/attack_vehicle/attack_vehicle.json",
      "/pa/units/land/fabrication_vehicle_adv/fabrication_vehicle_adv.json",
      "/pa/units/land/fabrication_vehicle/fabrication_vehicle.json",
      "/pa/units/land/land_scout/land_scout.json",
      "/pa/units/land/tank_armor/tank_armor.json",
      "/pa/units/land/tank_flak/tank_flak.json",
      "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
      "/pa/units/land/tank_heavy_mortar/tank_heavy_mortar.json",
      "/pa/units/land/tank_hover/tank_hover.json",
      "/pa/units/land/tank_laser_adv/tank_laser_adv.json",
      "/pa/units/land/tank_light_laser/tank_light_laser.json",
      "/pa/units/land/tank_nuke/tank_nuke.json",
    ];
    var mods = [];
    var modUnit = function (unit) {
      mods.push({
        file: unit,
        path: "build_metal_cost",
        op: "multiply",
        value: 0.75,
      });
    };
    _.forEach(units, modUnit);
    inventory.addMods(mods);
  },
  dull: function () {},
});
