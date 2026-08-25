define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Gil-E Upgrade Tech",
    description:
      "!LOC:Gil-E Upgrade Tech allows the sniper's shots to pass through terrain and hit their target instantly.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.gilE,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.gilEAmmo, "replace", {
          ammo_type: "AMMO_Beam",
          audio_loop: "/SE/Impacts/laser_blast",
          collision_audio: "/SE/Impacts/laser_blast",
          "recon.observable.ignore_radar": true,
          collision_check: "target",
          collision_response: "impact",
          fx_beam_spec: "/pa/units/land/bot_sniper/bot_sniper_ammo_beam.pfx",
          fx_collision_spec: "/pa/effects/specs/default_proj_explosion.pfx",
        })
      );
    },
  });
});
