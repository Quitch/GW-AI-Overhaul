define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Unit Cannon Upgrade Tech",
    description:
      "!LOC:Unit Cannon Upgrade Tech doubles the launch capacity of this interplanetary transport and removes all cooldowns.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.unitCannon,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.unitCannon, "push", {
            "factory.spawn_points": [
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
            ],
          })
          .concat(
            gwoCard.mods(gwoUnit.unitCannon, "replace", {
              factory_cooldown_time: 0,
              wait_to_rolloff_time: 0,
            })
          )
      );
    },
  });
});
