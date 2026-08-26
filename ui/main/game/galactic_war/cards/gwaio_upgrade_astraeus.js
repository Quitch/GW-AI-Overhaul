define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Astraeus Upgrade Tech",
    description:
      "!LOC:Astraeus Upgrade Tech increases the orbital lander's interplanetary movement speed by 200% and increases its carry capacity to 12 units.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_speed",
    requires: gwoUnit.astraeus,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.astraeus, "multiply", {
          system_velocity_multiplier: 3,
          gravwell_velocity_multiplier: 3,
          "transporter.capacity": 12,
        })
      );
    },
  });
});
