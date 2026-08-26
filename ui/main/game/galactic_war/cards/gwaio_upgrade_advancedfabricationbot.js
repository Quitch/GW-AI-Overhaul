define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Advanced Fabrication Bot Upgrade Tech",
    description:
      "!LOC:Advanced Fabrication Bot Upgrade Tech equips the advanced fabricator with the support commander's weapon.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_bot",
    requires: gwoUnit.botFabberAdvanced,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.botFabberAdvanced, "push", {
            tools: {
              spec_id: gwoUnit.colonelWeapon,
              aim_bone: "bone_turret",
              muzzle_bone: "socket_rightMuzzle",
              primary_weapon: true,
            },
            command_caps: "ORDER_Attack",
          })
          .concat([
            {
              file: gwoUnit.botFabberAdvanced,
              path: "tools.1.spec_id",
              op: "tag",
            },
          ])
      );
    },
  });
});
