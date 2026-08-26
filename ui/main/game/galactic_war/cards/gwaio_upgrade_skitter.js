define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Skitter Upgrade Tech",
    description:
      "!LOC:Skitter Upgrade Tech adds a low powered laser to the land scout and increases its vision by 100%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.skitter,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.skitter, "replace", {
            tools: [
              {
                spec_id: gwoUnit.skitterWeapon,
                aim_bone: "bone_root",
                muzzle_bone: "bone_root",
              },
            ],
          })
          .concat(
            [{ file: gwoUnit.skitter, path: "tools.0.spec_id", op: "tag" }],
            gwoCard.mods(gwoUnit.skitter, "push", {
              command_caps: "ORDER_Attack",
            }),
            gwoCard.mods(
              gwoUnit.skitter,
              "multiply",
              gwoCard.observerPaths(3, "radius"),
              2
            ),
            gwoCard.mods(gwoUnit.skitterAmmo, "multiply", {
              initial_velocity: 2,
              max_velocity: 2,
              damage: 2,
            })
          )
      );
    },
  });
});
