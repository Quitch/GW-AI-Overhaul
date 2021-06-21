define({
  visible: _.constant(true),
  describe: _.constant(
    "!LOC:Bot Engine Tech increases speed of all bots by 50%"
  ),
  summarize: _.constant("!LOC:Bot Engine Tech"),
  icon: _.constant(
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_combat.png"
  ),
  audio: function () {
    return {
      found: "/VO/Computer/gw/board_tech_available_speed",
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
      "/pa/units/land/assault_bot_adv/assault_bot_adv.json",
      "/pa/units/land/assault_bot/assault_bot.json",
      "/pa/units/land/bot_aa/bot_aa.json",
      "/pa/units/land/bot_bomb/bot_bomb.json",
      "/pa/units/land/bot_grenadier/bot_grenadier.json",
      "/pa/units/land/bot_nanoswarm/bot_nanoswarm.json",
      "/pa/units/land/bot_sniper/bot_sniper.json",
      "/pa/units/land/bot_support_commander/bot_support_commander.json",
      "/pa/units/land/bot_tactical_missile/bot_tactical_missile.json",
      "/pa/units/land/bot_tesla/bot_tesla.json",
      "/pa/units/land/fabrication_bot_adv/fabrication_bot_adv.json",
      "/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv.json",
      "/pa/units/land/fabrication_bot_combat/fabrication_bot_combat.json",
      "/pa/units/land/fabrication_bot/fabrication_bot.json",
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
        }
      );
    });
    inventory.addMods(mods);
  },
  dull: function () {},
});
