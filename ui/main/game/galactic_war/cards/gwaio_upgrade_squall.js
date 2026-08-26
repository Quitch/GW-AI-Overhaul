define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Squall Upgrade Tech",
    description:
      "!LOC:Squall Upgrade Tech allows you to issue orders to drones.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.squall,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.squall, "push", {
          command_caps: [
            "ORDER_Move",
            "ORDER_Patrol",
            "ORDER_Attack",
            "ORDER_Assist",
          ],
        })
      );
    },
  });
});
