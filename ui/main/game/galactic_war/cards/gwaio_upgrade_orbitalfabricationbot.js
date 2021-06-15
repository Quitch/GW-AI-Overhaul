define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Fabrication Bot Upgrade Tech allows the orbital fabricator to build all basic structures."
    ),
    summarize: _.constant("!LOC:Orbital Fabrication Bot Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_metal.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_orbital",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json"
        ) &&
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/orbital_launcher/orbital_launcher.json"
        ) &&
        !inventory.hasCard("nem_start_deepspace")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
          path: "buildable_types",
          op: "replace",
          value:
            "Land & Structure & Basic | Factory & Basic | FabBuild | FabOrbBuild",
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
    dull: function () {},
  };
});
