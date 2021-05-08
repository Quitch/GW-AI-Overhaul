define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Gil-E Upgrade Tech allows the sniper's shots to pass through terrain and hit their target instantly."
    ),
    summarize: _.constant("!LOC:Gil-E Upgrade Tech"),
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
        (gwaioFunctions.hasUnit(
          "/pa/units/land/bot_factory_adv/bot_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_botfactory")) &&
        gwaioFunctions.hasUnit("/pa/units/land/bot_sniper/bot_sniper.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/bot_sniper/bot_sniper_ammo.json",
          path: "ammo_type",
          op: "replace",
          value: "AMMO_Beam",
        },
        {
          file: "/pa/units/land/bot_sniper/bot_sniper_ammo.json",
          path: "audio_loop",
          op: "replace",
          value: "/SE/Impacts/laser_blast",
        },
        {
          file: "/pa/units/land/bot_sniper/bot_sniper_ammo.json",
          path: "collision_audio",
          op: "replace",
          value: "/SE/Impacts/laser_blast",
        },
        {
          file: "/pa/units/land/bot_sniper/bot_sniper_ammo.json",
          path: "recon.observable.ignore_radar",
          op: "replace",
          value: true,
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
