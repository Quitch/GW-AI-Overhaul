define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Typhoon Upgrade Tech",
    description:
      "!LOC:Typhoon Upgrade Tech doubles the number of drones held by the Typhoon and any other unit with drones.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.typhoon,
    chance: 30,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.typhoonWeapon, "multiply", {
          ammo_capacity: 2,
        })
      );
    },
  });
});
