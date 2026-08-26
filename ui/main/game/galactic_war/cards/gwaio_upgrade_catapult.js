define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Catapult Upgrade Tech",
    description:
      "!LOC:Catapult Upgrade Tech adds flak from the Storm flak tank to the tactical missile launcher.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_defense_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.catapult,
    chance: 30,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.catapult, "push", {
            tools: {
              spec_id: gwoUnit.stormWeapon,
              aim_bone: "bone_missile01",
              projectiles_per_fire: 4,
              muzzle_bone: [
                "bone_missile01",
                "bone_missile01",
                "bone_missile01",
                "bone_missile01",
              ],
            },
            unit_types: "UNITTYPE_AirDefense",
          })
          .concat([
            { file: gwoUnit.catapult, path: "tools.2.spec_id", op: "tag" },
          ])
      );
    },
  });
});
