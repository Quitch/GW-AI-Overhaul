define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:Commander Upgrade Tech increases Uber Cannon damage to structures and commanders by 300%."
  ),
  summarize: _.constant("!LOC:Commander Upgrade Tech"),
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
    return { chance: 30 };
  },
  buff: function (inventory) {
    inventory.addMods([
      {
        file: "/pa/ammo/cannon_uber/cannon_uber.json",
        path: "armor_damage_map.AT_Structure",
        op: "multiply",
        value: 4,
      },
      {
        file: "/pa/ammo/cannon_uber/cannon_uber.json",
        path: "armor_damage_map.AT_Commander",
        op: "multiply",
        value: 4,
      },
    ]);
  },
  dull: function () {},
});
