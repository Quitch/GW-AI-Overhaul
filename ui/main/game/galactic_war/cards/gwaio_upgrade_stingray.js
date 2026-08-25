define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Stingray Upgrade Tech",
    description:
      "!LOC:Stingray Upgrade Tech enables interception of tactical missiles by the missile ship and increases vision and radar radius by 50%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.stingray,
    chance: 30,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.stingray, "push", {
            tools: {
              spec_id: gwoUnit.gilEBeam,
              aim_bone: "socket_missile_muzzle01",
              record_index: 0,
              muzzle_bone: [
                "socket_missile_muzzle01",
                "socket_missile_muzzle02",
              ],
            },
          })
          .concat(
            [{ file: gwoUnit.stingray, path: "tools.3.spec_id", op: "tag" }],
            gwoCard.mods(
              gwoUnit.stingray,
              "multiply",
              gwoCard.eachPath(gwoCard.observerPaths(4, "radius"), 1.5)
            )
          )
      );
    },
  });
});
