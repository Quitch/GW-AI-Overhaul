define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Hummingbird Upgrade Tech",
    description:
      "!LOC:Hummingbird Upgrade Tech adds the ability for fighters to move between planets.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_air_engine_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_speed",
    requires: gwoUnit.hummingbird,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.hummingbird, "replace", {
            system_velocity_multiplier: 30,
            gravwell_velocity_multiplier: 10,
            "navigation.inter_planetary_type": "system",
          })
          .concat(
            gwoCard.mods(gwoUnit.hummingbird, "push", {
              unit_types: "UNITTYPE_Interplanetary",
            })
          )
      );
    },
  });
});
