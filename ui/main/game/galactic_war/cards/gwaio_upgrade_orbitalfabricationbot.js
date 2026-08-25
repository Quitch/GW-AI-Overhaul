define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoAI, gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Orbital Fabrication Bot Upgrade Tech",
    description:
      "!LOC:Orbital Fabrication Bot Upgrade Tech allows the orbital fabricator to build all basic structures.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_orbital",
    requires: gwoUnit.orbitalFabber,
    unless: "nem_start_deepspace",
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.orbitalFabber, "add", {
          buildable_types:
            " | (Land & Structure & Basic | Factory & Basic | FabBuild) & Custom58",
        })
      );

      var structures = [
        "BasicAirDefense",
        "BasicAirFactory",
        "BasicArtillery",
        "BasicBotFactory",
        "BasicEnergyGenerator",
        "BasicLandDefense",
        "BasicLandDefenseSingle",
        "BasicRadar",
        "BasicVehicleFactory",
        "EnergyStorage",
        "MetalStorage",
        "OrbitalLauncher",
        "Umbrella",
        "Wall",
      ];
      inventory.addAIMods(
        gwoAI.builderAppendMods("fabber", structures, "OrbitalFabber")
      );
    },
  });
});
