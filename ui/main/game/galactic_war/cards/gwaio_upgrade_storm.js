define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Storm Upgrade Tech",
    description:
      "!LOC:Storm Upgrade Tech enables interception of tactical missiles by the flak tank.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.storm,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.storm, "push", {
            tools: {
              spec_id: gwoUnit.gilEBeam,
              aim_bone: "socket_aim",
              muzzle_bone: [
                "socket_muzzle01",
                "socket_muzzle02",
                "socket_muzzle03",
                "socket_muzzle04",
              ],
            },
          })
          .concat([{ file: gwoUnit.storm, path: "tools.1.spec_id", op: "tag" }])
      );
    },
  });
});
