define(["shared/gw_common"], function (GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Bot Anti-Air tech enables building of Stinger bots. They are built via your basic Bot Factory."
    ),
    summarize: _.constant("!LOC:Bot Anti-Air Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_combat.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_bot",
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
      function hasUnit(id) {
        return _.any(model.game().inventory().units(), function (unit) {
          return id === unit;
        });
      }
      if (!hasUnit("/pa/units/land/bot_factory/bot_factory.json")) chance = 0;
      else if (dist > 0) {
        if (context.totalSize <= GW.balance.numberOfSystems[0]) {
          chance = 250;
          if (dist > 2) chance = 100;
        } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
          chance = 250;
          if (dist > 3) chance = 100;
        } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
          chance = 250;
          if (dist > 4) chance = 100;
        } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
          chance = 250;
          if (dist > 5) chance = 100;
        } else {
          chance = 250;
          if (dist > 6) chance = 100;
        }
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(["/pa/units/land/bot_aa/bot_aa.json"]);
      var mods = [
        {
          file: "/pa/units/land/bot_aa/bot_aa.json",
          path: "base_spec",
          op: "replace",
          value: "/pa/units/land/base_bot/base_bot.json",
        },
        {
          file: "/pa/units/land/bot_aa/bot_aa.json",
          path: "unit_types",
          op: "replace",
          value: [
            "UNITTYPE_Bot",
            "UNITTYPE_Mobile",
            "UNITTYPE_Offense",
            "UNITTYPE_AirDefense",
            "UNITTYPE_Land",
            "UNITTYPE_Basic",
            "UNITTYPE_FactoryBuild",
          ],
        },
        {
          file: "/pa/units/land/bot_aa/bot_aa.json",
          path: "selection_icon.diameter",
          op: "replace",
          value: 9,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
