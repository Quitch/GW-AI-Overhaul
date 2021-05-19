define({
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
      inventory.hasCard("gwc_start_vehicle")
    )
      chance = 60;

    return { chance: chance };
  },
  buff: function (inventory) {
    var units = [
      "/pa/units/land/fabrication_vehicle/fabrication_vehicle.json",
      "/pa/units/land/tank_light_laser/tank_light_laser.json",
      "/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json",
      "/pa/units/land/tank_armor/tank_armor.json",
      "/pa/units/land/land_scout/land_scout.json",
      "/pa/units/land/fabrication_vehicle_adv/fabrication_vehicle_adv.json",
      "/pa/units/land/tank_laser_adv/tank_laser_adv.json",
      "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
      "/pa/units/land/tank_heavy_mortar/tank_heavy_mortar.json",
      "/pa/units/land/tank_hover/tank_hover.json",
      "/pa/units/land/tank_flak/tank_flak.json",
      "/pa/units/land/tank_nuke/tank_nuke.json",
      "/pa/units/land/attack_vehicle/attack_vehicle.json",
    ];
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
  dull: function () {},
});
