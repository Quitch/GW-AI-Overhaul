define(["shared/gw_common"], function (GW) {
  return {
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
    deal: function (system, context) {
      var chance = 0;
      var dist = system.distance();
      if (dist > 0) {
        if (context.totalSize <= GW.balance.numberOfSystems[0]) {
          chance = 28;
          if (dist > 4) chance = 142;
        } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
          chance = 28;
          if (dist > 6) chance = 142;
        } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
          chance = 28;
          if (dist > 9) chance = 142;
        } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
          chance = 28;
          if (dist > 11) chance = 142;
        } else {
          chance = 28;
          if (dist > 13) chance = 142;
        }
      }

      return { chance: chance };
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
  };
});
