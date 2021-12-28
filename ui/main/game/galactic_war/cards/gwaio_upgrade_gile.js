define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Gil-E Upgrade Tech allows the sniper's shots to pass through terrain and hit their target instantly."
    ),
    summarize: _.constant("!LOC:Gil-E Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        (gwaioCards.hasUnit(gwaioUnits.botFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_botfactory")) &&
        gwaioCards.hasUnit(gwaioUnits.gilE)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.gilEAmmo,
          path: "ammo_type",
          op: "replace",
          value: "AMMO_Beam",
        },
        {
          file: gwaioUnits.gilEAmmo,
          path: "audio_loop",
          op: "replace",
          value: "/SE/Impacts/laser_blast",
        },
        {
          file: gwaioUnits.gilEAmmo,
          path: "collision_audio",
          op: "replace",
          value: "/SE/Impacts/laser_blast",
        },
        {
          file: gwaioUnits.gilEAmmo,
          path: "recon.observable.ignore_radar",
          op: "replace",
          value: true,
        },
        {
          file: gwaioUnits.gilEAmmo,
          path: "collision_check",
          op: "replace",
          value: "target",
        },
        {
          file: gwaioUnits.gilEAmmo,
          path: "collision_response",
          op: "replace",
          value: "impact",
        },
        {
          file: gwaioUnits.gilEAmmo,
          path: "fx_beam_spec",
          op: "replace",
          value: "/pa/units/land/bot_sniper/bot_sniper_ammo_beam.pfx",
        },
        {
          file: gwaioUnits.gilEAmmo,
          path: "fx_collision_spec",
          op: "replace",
          value: "/pa/effects/specs/default_proj_explosion.pfx",
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
