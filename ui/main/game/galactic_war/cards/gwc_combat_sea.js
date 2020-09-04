define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:Naval Combat Tech increases speed of all naval units by 50%, health by 50%, and damage by 25%"
  ),
  summarize: _.constant("!LOC:Naval Combat Tech"),
  icon: _.constant(
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
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
  deal: function () {
    var chance = 0;
    chance = 30;

    return { chance: chance };
  },
  buff: function (inventory) {
    var units = [
      "/pa/units/sea/attack_sub/attack_sub.json",
      "/pa/units/sea/battleship/battleship.json",
      "/pa/units/sea/destroyer/destroyer.json",
      "/pa/units/sea/drone_carrier/carrier/carrier.json",
      "/pa/units/sea/drone_carrier/drone/drone.json",
      "/pa/units/sea/fabrication_barge/fabrication_barge.json",
      "/pa/units/sea/fabrication_ship_adv/fabrication_ship_adv.json",
      "/pa/units/sea/fabrication_ship/fabrication_ship.json",
      "/pa/units/sea/frigate/frigate.json",
      "/pa/units/sea/hover_ship/hover_ship.json",
      "/pa/units/sea/missile_ship/missile_ship.json",
      "/pa/units/sea/nuclear_sub/nuclear_sub.json",
      "/pa/units/sea/sea_scout/sea_scout.json",
    ];
    var mods = [];
    var modUnit = function (unit) {
      mods.push({
        file: unit,
        path: "navigation.move_speed",
        op: "multiply",
        value: 1.5,
      });
      mods.push({
        file: unit,
        path: "navigation.brake",
        op: "multiply",
        value: 1.5,
      });
      mods.push({
        file: unit,
        path: "navigation.acceleration",
        op: "multiply",
        value: 1.5,
      });
      mods.push({
        file: unit,
        path: "navigation.turn_speed",
        op: "multiply",
        value: 1.5,
      });
      mods.push({
        file: unit,
        path: "max_health",
        op: "multiply",
        value: 1.5,
      });
    };
    _.forEach(units, modUnit);
    var ammos = [
      "/pa/units/sea/battleship/battleship_ammo.json",
      "/pa/units/sea/destroyer/destroyer_ammo.json",
      "/pa/units/sea/destroyer/destroyer_torpedo_ammo.json",
      "/pa/units/sea/drone_carrier/drone/drone_ammo_torpedo.json",
      "/pa/units/sea/drone_carrier/drone/drone_ammo.json",
      "/pa/units/sea/frigate/frigate_ammo_aa.json",
      "/pa/units/sea/frigate/frigate_ammo_shell.json",
      "/pa/units/sea/frigate/frigate_ammo_torpedo.json",
      "/pa/units/sea/hover_ship/hover_ship_ammo_side.json",
      "/pa/units/sea/hover_ship/hover_ship_ammo.json",
      "/pa/units/sea/missile_ship/missile_ship_aa_ammo.json",
      "/pa/units/sea/missile_ship/missile_ship_ammo.json",
      "/pa/units/sea/nuclear_sub/nuclear_sub_ammo_missile.json",
      "/pa/units/sea/nuclear_sub/nuclear_sub_ammo.json",
      "/pa/units/sea/sea_scout/sea_scout_ammo.json",
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
