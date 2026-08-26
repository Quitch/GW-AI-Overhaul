define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Solar Array Upgrade Tech",
    description:
      "!LOC:Solar Array Upgrade Tech enables interception of tactical missiles and drop pods by the Solar Array.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_speed",
    requires: gwoUnit.solarArray,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.solarArray, "push", {
            tools: [
              {
                spec_id: gwoUnit.gilEBeam,
                aim_bone: "bone_root",
                record_index: 0,
                fire_event: "fired",
                muzzle_bone: "bone_root",
              },
              {
                spec_id: gwoUnit.umbrellaBeam,
                aim_bone: "bone_root",
                record_index: 1,
                fire_event: "fired",
                muzzle_bone: "bone_root",
              },
            ],
          })
          .concat(
            _.times(2, function (i) {
              return {
                file: gwoUnit.solarArray,
                path: "tools." + i + ".spec_id",
                op: "tag",
              };
            })
          )
      );
    },
  });
});
