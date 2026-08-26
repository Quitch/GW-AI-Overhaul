define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return gwoCard.upgradeCard({
    name: "!LOC:Advanced Vehicle Factory Upgrade Tech",
    description:
      "!LOC:Advanced Vehicle Factory Upgrade Tech decreases advanced vehicle unit costs by 25% but also decreases the factory's health by 50%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_vehicle",
    requires: gwoUnit.vehicleFactoryAdvanced,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .flatMapMods(gwoGroup.vehiclesAdvancedMobile, "multiply", {
            build_metal_cost: 0.75,
          })
          .concat(
            gwoCard.mods(gwoUnit.vehicleFactoryAdvanced, "multiply", {
              max_health: 0.5,
            })
          )
      );
    },
  });
});
