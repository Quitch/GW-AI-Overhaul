define({
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
      chance = 70;

    return { chance: chance };
  },
  buff: function (inventory) {
    var units = [
      "/pa/units/land/aa_missile_vehicle/aa_missile_vehicle_ammo.json",
      "/pa/units/land/land_scout/land_scout_ammo.json",
      "/pa/units/land/land_scout/land_scout_ammo.json",
      "/pa/units/land/tank_armor/tank_armor_ammo.json",
      "/pa/units/land/tank_flak/tank_flak_ammo.json",
      "/pa/units/land/tank_heavy_armor/tank_heavy_armor_ammo.json",
      "/pa/units/land/tank_hover/tank_hover_ammo.json",
      "/pa/units/land/tank_laser_adv/tank_laser_adv_ammo.json",
      "/pa/units/land/tank_light_laser/tank_light_laser_ammo.json",
    ];
    var mods = [];
    var modUnit = function (unit) {
      mods.push({
        file: unit,
        path: "damage",
        op: "multiply",
        value: 1.25,
      });
    };
    _.forEach(units, modUnit);
    inventory.addMods(mods);
  },
  dull: function () {},
});
