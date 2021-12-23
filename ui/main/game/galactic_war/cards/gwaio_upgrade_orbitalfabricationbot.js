define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Fabrication Bot Upgrade Tech allows the orbital fabricator to build all basic structures."
    ),
    summarize: _.constant("!LOC:Orbital Fabrication Bot Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_orbital",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(gwaioUnits.orbitalFabber) &&
        gwaioFunctions.hasUnit(gwaioUnits.orbitalLauncher) &&
        !(
          inventory.hasCard("nem_start_deepspace") ||
          inventory.hasCard("gwc_start_orbital")
        )
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.orbitalFabber,
          path: "buildable_types",
          op: "add",
          value: " | Land & Structure & Basic | Factory & Basic | FabBuild",
        },
      ]);

      inventory.addAIMods([
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicAirFactory",
          idToMod: "builders",
          value: "OrbitalFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicAirDefense",
          idToMod: "builders",
          value: "OrbitalFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicLandDefenseSingle",
          idToMod: "builders",
          value: "OrbitalFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicLandDefense",
          idToMod: "builders",
          value: "OrbitalFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicArtillery",
          idToMod: "builders",
          value: "OrbitalFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "Wall",
          idToMod: "builders",
          value: "OrbitalFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "Umbrella",
          idToMod: "builders",
          value: "OrbitalFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicEnergyGenerator",
          idToMod: "builders",
          value: "OrbitalFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "EnergyStorage",
          idToMod: "builders",
          value: "OrbitalFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "MetalStorage",
          idToMod: "builders",
          value: "OrbitalFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicRadar",
          idToMod: "builders",
          value: "OrbitalFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicBotFactory",
          idToMod: "builders",
          value: "OrbitalFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicVehicleFactory",
          idToMod: "builders",
          value: "OrbitalFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "OrbitalLauncher",
          idToMod: "builders",
          value: "OrbitalFabber",
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
