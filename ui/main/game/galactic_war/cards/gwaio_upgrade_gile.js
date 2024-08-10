define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Gil-E Upgrade Tech allows the sniper's shots to pass through terrain and hit their target instantly."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
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
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.gilE)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.gilEAmmo,
          path: "ammo_type",
          op: "replace",
          value: "AMMO_Beam",
        },
        {
          file: gwoUnit.gilEAmmo,
          path: "audio_loop",
          op: "replace",
          value: "/SE/Impacts/laser_blast",
        },
        {
          file: gwoUnit.gilEAmmo,
          path: "collision_audio",
          op: "replace",
          value: "/SE/Impacts/laser_blast",
        },
        {
          file: gwoUnit.gilEAmmo,
          path: "recon.observable.ignore_radar",
          op: "replace",
          value: true,
        },
        {
          file: gwoUnit.gilEAmmo,
          path: "collision_check",
          op: "replace",
          value: "target",
        },
        {
          file: gwoUnit.gilEAmmo,
          path: "collision_response",
          op: "replace",
          value: "impact",
        },
        {
          file: gwoUnit.gilEAmmo,
          path: "fx_beam_spec",
          op: "replace",
          value: "/pa/units/land/bot_sniper/bot_sniper_ammo_beam.pfx",
        },
        {
          file: gwoUnit.gilEAmmo,
          path: "fx_collision_spec",
          op: "replace",
          value: "/pa/effects/specs/default_proj_explosion.pfx",
        },
      ]);
    },
    dull: function () {},
  };
});
