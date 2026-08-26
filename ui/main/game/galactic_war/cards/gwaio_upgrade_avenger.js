define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Avenger Upgrade Tech",
    description:
      "!LOC:Avenger Upgrade Tech adds a railgun to the orbital fighter.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.avenger,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.avenger, "push", {
            tools: [
              {
                spec_id: gwoUnit.artemisWeapon,
                aim_bone: "bone_body",
                muzzle_bone: "bone_recoil01",
              },
            ],
          })
          .concat([
            { file: gwoUnit.avenger, path: "tools.1.spec_id", op: "tag" },
          ])
      );
    },
  });
});
