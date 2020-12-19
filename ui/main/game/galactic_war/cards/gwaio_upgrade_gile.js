define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (GW, gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Upgrades the Gil-E's weapon to a railgun capable of passing through rocks and other matter."
    ),
    summarize: _.constant("!LOC:Scoped Railgun"),
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
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/land/bot_factory_adv/bot_factory_adv.json"
        ) &&
        gwaioFunctions.hasUnit("/pa/units/land/bot_sniper/bot_sniper.json")
      ) {
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
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/bot_sniper/bot_sniper_ammo.json",
          path: "base_spec",
          op: "replace",
          value: "/pa/ammo/base_beam/base_beam.json",
        },
        {
          file: "/pa/units/land/bot_sniper/bot_sniper_ammo.json",
          path: "collision_check",
          op: "replace",
          value: "target",
        },
        {
          file: "/pa/units/land/bot_sniper/bot_sniper_ammo.json",
          path: "collision_response",
          op: "replace",
          value: "impact",
        },
        {
          file: "/pa/units/land/bot_sniper/bot_sniper_ammo.json",
          path: "fx_beam_spec",
          op: "replace",
          value: "/pa/units/land/bot_sniper/bot_sniper_ammo_beam.pfx",
        },
        {
          file: "/pa/units/land/bot_sniper/bot_sniper_ammo.json",
          path: "fx_collision_spec",
          op: "replace",
          value: "/pa/effects/specs/default_proj_explosion.pfx",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
