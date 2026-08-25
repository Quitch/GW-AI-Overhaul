define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Spinner Upgrade Tech",
    description:
      "!LOC:Spinner Upgrade Tech increases the mobile anti-air's rate of fire by 200%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.spinner,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.spinnerWeapon, "multiply", {
          rate_of_fire: 3,
        })
      );
    },
  });
});
