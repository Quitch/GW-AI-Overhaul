define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Kaiju Upgrade Tech",
    description:
      "!LOC:Kaiju Upgrade Tech replaces the side-guns with additional main guns, resulting in additional range and damage.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_speed",
    requires: gwoUnit.kaiju,
    chance: 30,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.kaiju, "replace", {
            tools: [
              {
                spec_id: gwoUnit.kaijuWeapon,
                record_index: 0,
                fire_event: "fired0",
                aim_bone: "bone_pitch01",
                projectiles_per_fire: 2,
                muzzle_bone: ["socket_leftMuzzle01", "socket_rightMuzzle01"],
              },
              {
                spec_id: gwoUnit.kaijuWeapon,
                record_index: 1,
                fire_event: "fired1",
                aim_bone: "bone_pitch02",
                projectiles_per_fire: 2,
                muzzle_bone: ["socket_leftMuzzle02", "socket_rightMuzzle02"],
              },
              {
                spec_id: gwoUnit.kaijuWeapon,
                record_index: 2,
                fire_event: "fired2",
                aim_bone: "bone_pitch03",
                projectiles_per_fire: 2,
                muzzle_bone: ["socket_leftMuzzle03", "socket_rightMuzzle03"],
              },
              {
                spec_id: gwoUnit.kaijuWeapon,
                record_index: 3,
                fire_event: "fired3",
                aim_bone: "bone_pitch04",
                projectiles_per_fire: 2,
                muzzle_bone: ["socket_leftMuzzle04", "socket_rightMuzzle04"],
              },
            ],
          })
          .concat(
            _.times(4, function (i) {
              return {
                file: gwoUnit.kaiju,
                path: "tools." + i + ".spec_id",
                op: "tag",
              };
            })
          )
      );
    },
  });
});
