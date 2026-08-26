define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Drifter Upgrade Tech",
    description:
      "!LOC:Drifter Upgrade Tech increases the range of hover tank attacks by 25%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.drifter,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.drifterWeapon, "multiply", {
          max_range: 1.25,
        })
      );
    },
  });
});
