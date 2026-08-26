define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Leviathan Upgrade Tech",
    description:
      "!LOC:Leviathan Upgrade Tech replaces the battleship's cannons with Holkins advanced artillery.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_combat",
    requires: gwoUnit.leviathan,
    chance: 30,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.leviathan, "replace", {
            "tools.0.spec_id": gwoUnit.holkinsWeapon,
            "tools.0.projectiles_per_fire": 1,
            "tools.1.spec_id": gwoUnit.holkinsWeapon,
            "tools.1.projectiles_per_fire": 1,
            "tools.2.spec_id": gwoUnit.holkinsWeapon,
            "tools.2.projectiles_per_fire": 1,
            "tools.3.spec_id": gwoUnit.holkinsWeapon,
            "tools.3.projectiles_per_fire": 1,
          })
          .concat(
            _.times(4, function (i) {
              return {
                file: gwoUnit.leviathan,
                path: "tools." + i + ".spec_id",
                op: "tag",
              };
            })
          )
      );
    },
  });
});
