define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:The Uber Cannon deals 300% more damage to enemy structures."
  ),
  summarize: _.constant("!LOC:Base Breaker"),
  icon: _.constant(
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_combat.png"
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
  deal: function () {
    return { chance: 80 };
  },
  buff: function (inventory) {
    var mods = [
      {
        file: "/pa/ammo/cannon_uber/cannon_uber.json",
        path: "armor_damage_map.AT_Structure",
        op: "multiply",
        value: 4,
      },
    ];
    inventory.addMods(mods);
  },
  dull: function () {},
});
