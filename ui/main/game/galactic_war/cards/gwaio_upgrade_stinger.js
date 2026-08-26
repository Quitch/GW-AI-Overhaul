define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Stinger Upgrade Tech",
    description:
      "!LOC:Stinger Upgrade Tech replaces the anti-air bot's missiles with flak from the Flak Cannon. It fires two projectiles per volley as opposed to the Flak Cannons' four.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.stinger,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.stinger, "replace", {
            tools: [
              {
                spec_id: gwoUnit.flakWeapon,
                aim_bone: "bone_turret",
                projectiles_per_fire: 2,
                muzzle_bone: ["socket_rightMuzzle", "socket_leftMuzzle"],
              },
            ],
          })
          .concat([
            { file: gwoUnit.stinger, path: "tools.0.spec_id", op: "tag" },
          ])
      );
    },
  });
});
