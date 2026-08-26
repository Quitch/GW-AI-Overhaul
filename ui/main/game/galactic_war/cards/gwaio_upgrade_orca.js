define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Orca Upgrade Tech",
    description:
      "!LOC:Orca Upgrade Tech changes the destroyer to a water hover unit, preventing torpedoes from targeting it and allowing the navigation of shallow waters. Surface weapon range is increased by 50%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_speed",
    requires: gwoUnit.orca,
    chance: 30,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.orca, "push", { unit_types: "UNITTYPE_WaterHover" })
          .concat(
            gwoCard.mods(gwoUnit.orca, "replace", {
              "navigation.type": "water-hover",
            }),
            gwoCard.mods(gwoUnit.orcaWeapon, "multiply", { max_range: 1.5 })
          )
      );
    },
  });
});
