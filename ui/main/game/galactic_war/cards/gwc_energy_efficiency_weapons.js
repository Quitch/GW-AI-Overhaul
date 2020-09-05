define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:Improved Energy Weapons tech reduces energy costs for energy based weapons by 75%"
  ),
  summarize: _.constant("!LOC:Improved Energy Weapons"),
  icon: _.constant(
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_energy.png"
  ),
  audio: function () {
    return {
      found: "/VO/Computer/gw/board_tech_available_weapon_upgrade",
    };
  },
  getContext: function (galaxy) {
    return {
      totalSize: galaxy.stars().length,
    };
  },
  deal: function () {
    var chance = 0;

    return { chance: chance };
  },
  buff: function (inventory) {
    var weaps = [
      "/pa/tools/uber_cannon/uber_cannon.json",
      "/pa/units/air/bomber_heavy/bomber_heavy_tool_weapon.json",
      "/pa/units/air/bomber/bomber_tool_weapon.json",
      "/pa/units/air/solar_drone/solar_drone_tool_weapon.json",
      "/pa/units/air/titan_air/titan_air_tool_weapon.json",
      "/pa/units/land/artillery_long/artillery_long_tool_weapon.json",
      "/pa/units/land/artillery_short/artillery_short_tool_weapon.json",
      "/pa/units/land/bot_tesla/bot_tesla_tool_weapon.json",
      "/pa/units/orbital/orbital_laser/orbital_laser_tool_weapon.json",
      "/pa/units/orbital/orbital_railgun/orbital_railgun_tool_weapon.json",
      "/pa/units/orbital/titan_orbital/titan_orbital_tool_weapon_ground.json",
    ];
    var mods = [];
    weaps.forEach(function (weap) {
      mods.push(
        {
          file: weap,
          path: "ammo_capacity",
          op: "multiply",
          value: 0.25,
        },
        {
          file: weap,
          path: "ammo_demand",
          op: "multiply",
          value: 0.25,
        },
        {
          file: weap,
          path: "ammo_per_shot",
          op: "multiply",
          value: 0.25,
        }
      );
    });
    inventory.addMods(mods);
  },
  dull: function () {},
});
