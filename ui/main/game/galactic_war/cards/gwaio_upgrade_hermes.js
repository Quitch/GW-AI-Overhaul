define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Hermes Upgrade Tech",
    description:
      "!LOC:Hermes Upgrade Tech increases the vision of the space probe by 50%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.hermes,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(
          gwoUnit.hermes,
          "multiply",
          gwoCard.observerPaths(3, "radius"),
          1.5
        )
      );
    },
  });
});
