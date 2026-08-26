define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Barracuda Upgrade Tech",
    description:
      "!LOC:Barracuda Upgrade Tech increases the rate of fire of the submarine by 200%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.barracuda,
    chance: 30,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.barracudaWeapon, "multiply", {
          rate_of_fire: 3,
        })
      );
    },
  });
});
