define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Advanced Fabrication Aircraft Upgrade Tech",
    description:
      "!LOC:Advanced Fabrication Aircraft Upgrade Tech adds the ability for the advanced fabricator to move between planets.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_air",
    requires: gwoUnit.airFabberAdvanced,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.airFabberAdvanced, "replace", {
            system_velocity_multiplier: 30,
            gravwell_velocity_multiplier: 10,
            "navigation.inter_planetary_type": "system",
          })
          .concat(
            gwoCard.mods(gwoUnit.airFabberAdvanced, "push", {
              unit_types: "UNITTYPE_Interplanetary",
            })
          )
      );
    },
  });
});
