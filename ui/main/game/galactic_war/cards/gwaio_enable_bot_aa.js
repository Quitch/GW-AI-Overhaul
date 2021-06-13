define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (GW, gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Bot Anti-Air Tech enables the building of Stinger bots. They are built via your basic Bot Factory."
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
      if (
        gwaioFunctions.hasUnit("/pa/units/land/bot_factory/bot_factory.json") &&
        dist > 0
      )
        if (
          !gwaioFunctions.hasUnit(
            "/pa/units/land/vehicle_factory/vehicle_factory.json"
          ) &&
          gwaioFunctions.hasUnit("/pa/units/air/air_factory/air_factory.json")
        )
          chance = 250;
        else if (context.totalSize <= GW.balance.numberOfSystems[0]) {
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

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(["/pa/units/land/bot_aa/bot_aa.json"]);
      inventory.addMods([
        {
          file: "/pa/units/land/bot_aa/bot_aa.json",
          path: "base_spec",
          op: "replace",
          value: "/pa/units/land/base_bot/base_bot.json",
        },
        {
          file: "/pa/units/land/bot_aa/bot_aa.json",
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_FactoryBuild",
        },
        {
          file: "/pa/units/land/bot_aa/bot_aa.json",
          path: "selection_icon.diameter",
          op: "replace",
          value: 9,
        },
      ]);
      inventory.addAIMods([
        {
          type: "factory",
          op: "load",
          value: "gwaio_enable_bot_aa.json",
        },
      ]);
    },
    dull: function () {},
  };
});
