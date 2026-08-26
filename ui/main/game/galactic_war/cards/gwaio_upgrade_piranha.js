define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Piranha Upgrade Tech",
    description:
      "!LOC:Piranha Upgrade Tech changes the gunboat into a hover unit, allowing it to cross land and lava.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_speed",
    requires: gwoUnit.piranha,
    chance: 30,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.piranha, "push", { unit_types: "UNITTYPE_Hover" })
          .concat(
            gwoCard.mods(gwoUnit.piranha, "replace", {
              "navigation.type": "hover",
            })
          )
      );
    },
  });
});
