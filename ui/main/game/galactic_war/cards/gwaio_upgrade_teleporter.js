define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Teleporter Upgrade Tech",
    description:
      "!LOC:Teleporter Upgrade Tech removes all energy consumption and efficiency requirements from the interplanetary teleporter and makes it invisible to radar.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_energy_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_efficiency",
    requires: gwoUnit.teleporter,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.teleporter, "replace", {
          energy_efficiency_requirement: 0,
          "teleporter.energy_demand": 0,
          "recon.observable.ignore_radar": true,
        })
      );
    },
  });
});
