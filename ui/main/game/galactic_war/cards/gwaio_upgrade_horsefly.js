define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Horsefly Upgrade Tech",
    description:
      "!LOC:Horsefly Upgrade Tech adds the Bumblebee carpet bomber's weapon to the strafer.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.horsefly,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.horsefly, "push", {
            tools: {
              spec_id: gwoUnit.bumblebeeWeapon,
              aim_bone: "bone_root",
              muzzle_bone: "bone_root",
            },
          })
          .concat([
            { file: gwoUnit.horsefly, path: "tools.1.spec_id", op: "tag" },
          ])
      );
    },
  });
});
