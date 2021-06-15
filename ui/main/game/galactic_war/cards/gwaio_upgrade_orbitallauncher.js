define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Launcher Upgrade Tech enables the building of advanced units by basic orbital manufacturing."
    ),
    summarize: _.constant("!LOC:Orbital Launcher Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png"
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
    deal: function () {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/orbital_launcher/orbital_launcher.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/orbital/orbital_launcher/orbital_launcher.json",
          path: "buildable_types",
          op: "replace",
          value: "Orbital & FactoryBuild",
        },
      ]);

      inventory.addAIMods([
        {
          type: "factory",
          op: "append",
          toBuild: "SolarArray",
          idToMod: "builders",
          value: "OrbitalLauncher",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "OrbitalDeathLaser",
          idToMod: "builders",
          value: "OrbitalLauncher",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedRadarSattelite",
          idToMod: "builders",
          value: "OrbitalLauncher",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "OrbitalRailgun",
          idToMod: "builders",
          value: "OrbitalLauncher",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "OrbitalBattleShip",
          idToMod: "builders",
          value: "OrbitalLauncher",
        },
      ]);
    },
    dull: function () {},
  };
});
