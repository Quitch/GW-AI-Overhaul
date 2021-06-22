define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:Bot Ammunition Tech increases damage of all bots by 25%"
  ),
  summarize: _.constant("!LOC:Bot Ammunition Tech"),
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
  deal: function (system, context, inventory) {
    var chance = 0;
    if (
      inventory.hasCard("gwc_enable_bots_t1") ||
      inventory.hasCard("gwc_enable_bots_all") ||
      inventory.hasCard("gwc_start_bot") ||
      inventory.hasCard("gwaio_start_hoarder")
    )
      chance = 70;

    return { chance: chance };
  },
  buff: function (inventory) {
    var units = [
      "/pa/units/land/assault_bot_adv/assault_bot_adv_ammo.json",
      "/pa/units/land/assault_bot/assault_bot_ammo.json",
      "/pa/units/land/bot_aa/bot_aa_ammo.json",
      "/pa/units/land/bot_bomb/bot_bomb_ammo.json",
      "/pa/units/land/bot_nanoswarm/bot_nanoswarm_ammo.json",
      "/pa/units/land/bot_sniper/bot_sniper_ammo.json",
      "/pa/units/land/bot_support_commander/bot_support_commander_ammo.json",
      "/pa/units/land/bot_tactical_missile/bot_tactical_missile_ammo.json",
      "/pa/units/land/bot_tesla/bot_tesla_ammo.json",
    ];
    var mods = [];
    units.forEach(function (unit) {
      mods.push({
        file: unit,
        path: "damage",
        op: "multiply",
        value: 1.25,
      });
    });
    inventory.addMods(mods);
  },
  dull: function () {},
});
