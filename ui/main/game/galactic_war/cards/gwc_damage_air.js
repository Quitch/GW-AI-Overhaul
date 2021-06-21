define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:Air Ammunition Tech increases damage of all mobile air units by 25%"
  ),
  summarize: _.constant("!LOC:Air Ammunition Tech"),
  icon: _.constant(
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
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
      inventory.hasCard("gwc_enable_air_t1") ||
      inventory.hasCard("gwc_enable_air_all") ||
      inventory.hasCard("gwc_start_air") ||
      inventory.hasCard("gwaio_start_hoarder")
    )
      chance = 70;

    return { chance: chance };
  },
  buff: function (inventory) {
    var ammos = [
      "/pa/units/air/air_scout/air_scout_ammo.json",
      "/pa/units/air/bomber_adv/bomber_adv_ammo.json",
      "/pa/units/air/bomber_heavy/bomber_heavy_ammo.json",
      "/pa/units/air/bomber/bomber_ammo.json",
      "/pa/units/air/fighter/fighter_ammo.json",
      "/pa/units/air/fighter_adv/fighter_adv_ammo.json",
      "/pa/units/air/gunship/gunship_ammo.json",
      "/pa/units/air/solar_drone/solar_drone_ammo.json",
      "/pa/units/air/strafer/strafer_ammo.json",
    ];
    var mods = [];
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
