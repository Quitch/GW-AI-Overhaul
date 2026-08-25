define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Narwhal Upgrade Tech",
    description:
      "!LOC:Narwhal Upgrade Tech doubles the rate of fire of all weapons.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.narwhal,
    chance: 30,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.flatMapMods(
          [gwoUnit.narwhalWeapon, gwoUnit.narwhalAA, gwoUnit.narwhalTorpedo],
          "multiply",
          { rate_of_fire: 2 }
        )
      );
    },
  });
});
