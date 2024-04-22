define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Commander Ammunition Tech increases damage of your commanders by 25%"
    ),
    summarize: _.constant("!LOC:Commander Ammunition Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_speed.png"
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
      var chance = 24;
      var dist = system.distance();
      if (
        context.totalSize <= GW.balance.numberOfSystems[0] ||
        context.totalSize <= GW.balance.numberOfSystems[1]
      ) {
        chance = 12;
      } else if (
        (context.totalSize <= GW.balance.numberOfSystems[2] && dist > 6) ||
        (context.totalSize <= GW.balance.numberOfSystems[3] && dist > 9) ||
        dist > 12
      ) {
        chance = 120;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var ammos = gwoGroup.commanderAmmo;
      var mods = [];
      _.forEach(ammos, function (ammo) {
        mods.push(
          {
            file: ammo,
            path: "damage",
            op: "multiply",
            value: 1.25,
          },
          {
            file: ammo,
            path: "splash_damage",
            op: "multiply",
            value: 1.25,
          }
        );
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
