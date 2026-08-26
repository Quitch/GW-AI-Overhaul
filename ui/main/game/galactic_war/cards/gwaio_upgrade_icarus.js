define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Icarus Upgrade Tech",
    description:
      "!LOC:Icarus Upgrade Tech adds production of 2 metal to the solar drone.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_storage_compression_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_economy",
    requires: gwoUnit.icarus,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.icarus, "replace", { "production.metal": 2 })
      );

      inventory.addAIMods([
        {
          type: "factory",
          op: "new",
          toBuild: "SolarDrone",
          value: [
            {
              test_type: "DesireMetal",
            },
            {
              test_type: "CanAffordBuildDemand",
            },
          ],
        },
      ]);
    },
  });
});
