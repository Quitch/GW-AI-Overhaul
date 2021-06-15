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
          value: "OrbitalFabber",
          idToMod: "builders",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicAirDefense",
          value: "OrbitalFabber",
          idToMod: "builders",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicLandDefenseSingle",
          value: "OrbitalFabber",
          idToMod: "builders",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicLandDefense",
          value: "OrbitalFabber",
          idToMod: "builders",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicArtillery",
          value: "OrbitalFabber",
          idToMod: "builders",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "Wall",
          value: "OrbitalFabber",
          idToMod: "builders",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "Umbrella",
          value: "OrbitalFabber",
          idToMod: "builders",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicEnergyGenerator",
          value: "OrbitalFabber",
          idToMod: "builders",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "EnergyStorage",
          value: "OrbitalFabber",
          idToMod: "builders",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "MetalStorage",
          value: "OrbitalFabber",
          idToMod: "builders",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicRadar",
          value: "OrbitalFabber",
          idToMod: "builders",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicBotFactory",
          value: "OrbitalFabber",
          idToMod: "builders",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "BasicVehicleFactory",
          value: "OrbitalFabber",
          idToMod: "builders",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "OrbitalLauncher",
          value: "OrbitalFabber",
          idToMod: "builders",
        },
      ]);
    },
    dull: function () {},
  };
});
