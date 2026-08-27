define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  var loadout = gwoCard.loadout(CARD, {
    bank: gwoBank,
    start: GWCStart,
    apply: function (inventory) {
      var playerIsCluster = gwoCard.playerIsCluster(inventory);

      // These run after cluster_setup.js tags Cluster's Sub Commanders
      // NoBuild, so a bare `Mobile & <layer>` clause would match one and
      // hand Cluster a buildable. The basic fabbers require Basic, so are safe.
      var advancedBotFabberBuilds =
        "(Mobile & Bot | Land & Structure & Advanced - Factory | " +
        "FabAdvBuild | FabBuild - Factory | Titan & Bot) & Custom58 - NoBuild";

      var mods = [
        {
          file: gwoUnit.airFactory,
          path: "buildable_types",
          op: "replace",
          value: "(Air & Fabber & Basic & Mobile) & FactoryBuild & Custom58",
        },
        {
          file: gwoUnit.airFactoryAdvanced,
          path: "buildable_types",
          op: "replace",
          value: "(Air & Fabber & Mobile) & FactoryBuild & Custom58",
        },
        {
          file: gwoUnit.botFactory,
          path: "buildable_types",
          op: "replace",
          value: "(Bot & Fabber & Basic & Mobile) & FactoryBuild & Custom58",
        },
        {
          file: gwoUnit.botFactoryAdvanced,
          path: "buildable_types",
          op: "replace",
          value: "(Bot & Fabber & Mobile) & FactoryBuild & Custom58",
        },
        {
          file: gwoUnit.vehicleFactory,
          path: "buildable_types",
          op: "replace",
          value: "(Tank & Fabber & Basic & Mobile) & FactoryBuild & Custom58",
        },
        {
          file: gwoUnit.vehicleFactoryAdvanced,
          path: "buildable_types",
          op: "replace",
          value: "(Tank & Fabber & Mobile) & FactoryBuild & Custom58",
        },
        {
          file: gwoUnit.navalFactory,
          path: "buildable_types",
          op: "replace",
          value: "(Naval & Fabber & Basic & Mobile) & FactoryBuild & Custom58",
        },
        {
          file: gwoUnit.navalFactoryAdvanced,
          path: "buildable_types",
          op: "replace",
          value: "(Naval & Fabber & Mobile) & FactoryBuild & Custom58",
        },
        {
          file: gwoUnit.orbitalLauncher,
          path: "buildable_types",
          op: "replace",
          value:
            "(Orbital & Fabber & Basic & Mobile) & FactoryBuild & Custom58",
        },
        {
          file: gwoUnit.orbitalFactory,
          path: "buildable_types",
          op: "replace",
          value:
            "(Orbital & Fabber & Basic & Mobile) & FactoryBuild & Custom58",
        },
        {
          file: gwoUnit.unitCannon,
          path: "buildable_types",
          op: "replace",
          value: "CannonBuildable & Fabber & Custom58",
        },
        {
          file: gwoUnit.airFabber,
          path: "buildable_types",
          op: "replace",
          value:
            "(Mobile & Basic & Air | Land & Structure & Basic - Factory | Factory & Advanced & Air | FabBuild - Factory) & Custom58",
        },
        {
          file: gwoUnit.airFabberAdvanced,
          path: "buildable_types",
          op: "replace",
          value:
            "(Mobile & Air | Land & Structure & Advanced - Factory | FabAdvBuild | FabBuild - Factory | Titan & Air) & Custom58 - NoBuild",
        },
        {
          file: gwoUnit.botFabber,
          path: "buildable_types",
          op: "replace",
          value:
            "(Mobile & Basic & Bot | Land & Structure & Basic - Factory | Factory & Advanced & Bot & Land | FabBuild - Factory) & Custom58",
        },
        {
          file: gwoUnit.botFabberAdvanced,
          path: "buildable_types",
          op: "replace",
          value: advancedBotFabberBuilds,
        },
        {
          file: gwoUnit.vehicleFabber,
          path: "buildable_types",
          op: "replace",
          value:
            "(Mobile & Basic & Tank | Land & Structure & Basic - Factory | Factory & Land & Tank & Advanced | FabBuild - Factory) & Custom58",
        },
        {
          file: gwoUnit.vehicleFabberAdvanced,
          path: "buildable_types",
          op: "replace",
          value:
            "(Mobile & Tank | Structure & Land & Advanced - Factory | FabAdvBuild | FabBuild - Factory | Titan & (Tank | Naval)) & Custom58 - NoBuild",
        },
        {
          file: gwoUnit.navalFabber,
          path: "buildable_types",
          op: "replace",
          value:
            "(Mobile & Basic & Naval | Naval & Structure & Basic - Factory | Naval & Factory & Advanced | FabBuild - Factory) & Custom58",
        },
        {
          file: gwoUnit.navalFabberAdvanced,
          path: "buildable_types",
          op: "replace",
          value:
            "(Mobile & Naval | Naval & Structure & Advanced - Factory | FabAdvBuild | FabBuild - Factory) & Custom58 - NoBuild",
        },
        // factory-built fabbers spawn on the wrong layer without this
        {
          file: gwoUnit.barracuda,
          path: "spawn_layers",
          op: "replace",
          value: "WL_DeepWater",
        },
        {
          file: gwoUnit.kraken,
          path: "spawn_layers",
          op: "replace",
          value: "WL_DeepWater",
        },
        {
          file: gwoUnit.kestrel,
          path: "spawn_layers",
          op: "replace",
          value: "WL_LandHorizontal",
        },
        {
          file: "/pa/units/orbital/base_orbital/base_orbital.json",
          path: "spawn_layers",
          op: "replace",
          value: "WL_Orbital",
        },
      ];
      if (!playerIsCluster) {
        mods.push({
          file: gwoUnit.colonel,
          path: "buildable_types",
          op: "replace",
          value: advancedBotFabberBuilds,
        });
      }
      if (inventory.hasCard("gwc_enable_orbital_all")) {
        mods.push({
          file: gwoUnit.orbitalFabber,
          path: "buildable_types",
          op: "replace",
          value: "(Orbital & FactoryBuild | FabOrbBuild - Factory) & Custom58",
        });
      } else {
        mods.push({
          file: gwoUnit.orbitalFabber,
          path: "buildable_types",
          op: "replace",
          value:
            "(Orbital & FactoryBuild & Basic | FabOrbBuild - Factory) & Custom58",
        });
      }
      inventory.addMods(mods);

      var aiMods = [
        {
          type: "fabber",
          op: "replace",
          toBuild: "OrbitalLauncher",
          idToMod: "priority",
          value: 0,
        },
        {
          type: "fabber",
          op: "replace",
          toBuild: "OrbitalFactory",
          idToMod: "priority",
          value: 0,
        },
      ];
      var types = ["fabber", "factory"];
      _.forEach(types, function (type) {
        aiMods.push({
          type: type,
          op: "load",
          value: CARD.id + ".json",
        });
      });
      var factories = [
        "BasicAirFactory",
        "BasicBotFactory",
        "BasicNavalFactory",
        "BasicVehicleFactory",
        "AdvancedAirFactory",
        "AdvancedBotFactory",
        "AdvancedNavalFactory",
        "AdvancedVehicleFactory",
      ];
      _.forEach(factories, function (factory) {
        aiMods.push({
          type: "fabber",
          op: "replace",
          toBuild: factory,
          idToMod: "priority",
          value: 0,
        });
      });
      inventory.addAIMods(aiMods);
    },
  });
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Rapid Deployment Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Factories build fabricators and fabricators build units."
    ),
    hint: gwoCard.lockedHint("!LOC:Rapid Deployment Commander"),
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
