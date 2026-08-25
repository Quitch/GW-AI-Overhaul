define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Slammer Upgrade Tech",
    description:
      "!LOC:Slammer Upgrade Tech changes the advanced assault bot's torpedo into a rocket that targets surface units.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_combat",
    requires: gwoUnit.slammer,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.slammer, "replace", { "tools.1.show_range": true })
          .concat(
            gwoCard.mods(gwoUnit.slammerTorpedo, "replace", {
              spawn_layers: "WL_Air",
            }),
            gwoCard.mods(gwoUnit.slammerTorpedo, "push", {
              target_layers: "WL_LandHorizontal",
            }),
            gwoCard.mods(gwoUnit.slammerTorpedo, "replace", {
              target_priorities: ["Mobile", "Structure - Wall", "Wall"],
            }),
            gwoCard.mods(gwoUnit.slammerTorpedoLandAmmo, "replace", {
              flight_layer: "Air",
              spawn_layers: "WL_Air",
              cruise_height: 200,
            })
          )
      );
    },
  });
});
