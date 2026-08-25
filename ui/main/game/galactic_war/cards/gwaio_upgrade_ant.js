define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Ant Upgrade Tech",
    description:
      "!LOC:Ant Upgrade Tech adds splash damage to the light tank's attack.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.ant,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.antAmmo, "replace", {
          splash_damage: 63,
          splash_radius: 10,
          full_damage_splash_radius: 2,
          events: {
            died: {
              audio_cue: "/SE/Impacts/bot_spark_impact",
              effect_spec: "/pa/effects/specs/tesla_hit.pfx",
            },
          },
        })
      );
    },
  });
});
