define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Launcher Upgrade Tech enables the building of advanced units by basic orbital manufacturing."
    ),
    summarize: _.constant("!LOC:Orbital Launcher Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png"
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
        gwaioFunctions.hasUnit(gwaioUnits.orbitalLauncher) &&
        !inventory.hasCard("gwaio_start_rapid")
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.orbitalLauncher,
          path: "buildable_types",
          op: "add",
          value: "| (Orbital & FactoryBuild)",
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
        {
          type: "factory",
          op: "replace",
          toBuild: "SolarArray",
          idToMod: "priority",
          value: 100,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "OrbitalDeathLaser",
          idToMod: "priority",
          value: 100,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "AdvancedRadarSattelite",
          idToMod: "priority",
          value: 100,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "OrbitalRailgun",
          idToMod: "priority",
          value: 100,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "OrbitalBattleShip",
          idToMod: "priority",
          value: 100,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
