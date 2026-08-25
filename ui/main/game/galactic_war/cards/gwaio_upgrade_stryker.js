define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Stryker Upgrade Tech",
    description:
      "!LOC:Stryker Upgrade Tech adds the ability for the attack vehicle to attack through self-destructing.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.stryker,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.stryker, "prepend", {
            tools: {
              spec_id: gwoUnit.boomWeapon,
              aim_bone: "bone_root",
              muzzle_bone: "bone_root",
            },
          })
          .concat(
            [{ file: gwoUnit.stryker, path: "tools.0.spec_id", op: "tag" }],
            gwoCard.mods(gwoUnit.stryker, "push", {
              unit_types: "UNITTYPE_SelfDestruct",
            })
          )
      );
    },
  });
});
