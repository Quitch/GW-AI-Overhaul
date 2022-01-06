define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GWCStart, gwaioBank, gwaioCards, gwaioUnits) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Rapid Deployment Commander"),
    icon: function () {
      return gwaioCards.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Factories build fabricators and fabricators build units."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Rapid Deployment Commander",
      };
    },
    deal: gwaioCards.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);

          var mods = [
            {
              file: gwaioUnits.airFactory,
              path: "buildable_types",
              op: "replace",
              value: "(Air & Fabber & Basic & Mobile) & FactoryBuild",
            },
            {
              file: gwaioUnits.airFactoryAdvanced,
              path: "buildable_types",
              op: "replace",
              value: "(Air & Fabber & Mobile) & FactoryBuild",
            },
            {
              file: gwaioUnits.botFactory,
              path: "buildable_types",
              op: "replace",
              value: "(Bot & Fabber & Basic & Mobile) & FactoryBuild",
            },
            {
              file: gwaioUnits.botFactoryAdvanced,
              path: "buildable_types",
              op: "replace",
              value: "(Bot & Fabber & Mobile) & FactoryBuild",
            },
            {
              file: gwaioUnits.vehicleFactory,
              path: "buildable_types",
              op: "replace",
              value: "(Tank & Fabber & Basic & Mobile) & FactoryBuild",
            },
            {
              file: gwaioUnits.vehicleFactoryAdvanced,
              path: "buildable_types",
              op: "replace",
              value: "(Tank & Fabber & Mobile) & FactoryBuild",
            },
            {
              file: gwaioUnits.navalFactory,
              path: "buildable_types",
              op: "replace",
              value: "(Naval & Fabber & Basic & Mobile) & FactoryBuild",
            },
            {
              file: gwaioUnits.navalFactoryAdvanced,
              path: "buildable_types",
              op: "replace",
              value: "(Naval & Fabber & Mobile) & FactoryBuild",
            },
            {
              file: gwaioUnits.orbitalLauncher,
              path: "buildable_types",
              op: "replace",
              value: "(Orbital & Fabber & Basic & Mobile) & FactoryBuild",
            },
            {
              file: gwaioUnits.orbitalFactory,
              path: "buildable_types",
              op: "replace",
              value: "(Orbital & Fabber & Basic & Mobile) & FactoryBuild",
            },
            {
              file: gwaioUnits.airFabber,
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Basic & Air | Land & Structure & Basic - Factory | Factory & Advanced & Air | FabBuild - Factory",
            },
            {
              file: gwaioUnits.airFabber,
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Basic & Air | Land & Structure & Basic - Factory | Factory & Advanced & Air | FabBuild - Factory",
            },
            {
              file: gwaioUnits.airFabberAdvanced,
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Air | Land & Structure & Advanced - Factory | FabAdvBuild | FabBuild - Factory | Titan & Air",
            },
            {
              file: gwaioUnits.botFabber,
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Basic & Bot | Land & Structure & Basic - Factory | Factory & Advanced & Bot & Land | FabBuild - Factory",
            },
            {
              file: gwaioUnits.botFabberAdvanced,
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Bot | Land & Structure & Advanced - Factory | FabAdvBuild | FabBuild - Factory | Titan & Bot",
            },
            {
              file: gwaioUnits.colonel,
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Bot | Land & Structure & Advanced - Factory | FabAdvBuild | FabBuild - Factory | Titan & Bot",
            },
            {
              file: gwaioUnits.vehicleFabber,
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Basic & Tank | Land & Structure & Basic - Factory | Factory & Land & Tank & Advanced | FabBuild - Factory",
            },
            {
              file: gwaioUnits.vehicleFabberAdvanced,
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Tank | Structure & Land & Advanced - Factory | FabAdvBuild | FabBuild - Factory | Titan & (Tank | Naval)",
            },
            {
              file: gwaioUnits.navalFabber,
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Basic & Naval | Naval & Structure & Basic - Factory | Naval & Factory & Advanced | FabBuild - Factory",
            },
            {
              file: gwaioUnits.navalFabberAdvanced,
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Naval | Naval & Structure & Advanced - Factory | FabAdvBuild | FabBuild - Factory",
            },
            // fix placement issues
            {
              file: gwaioUnits.barracuda,
              path: "spawn_layers",
              op: "replace",
              value: "WL_DeepWater",
            },
            {
              file: gwaioUnits.kraken,
              path: "spawn_layers",
              op: "replace",
              value: "WL_DeepWater",
            },
            {
              file: gwaioUnits.kestrel,
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

          // control orbital T1/T2 access
          if (
            inventory.hasCard("gwc_enable_orbital_t2") ||
            inventory.hasCard("gwc_enable_orbital_all") ||
            inventory.hasCard("gwaio_upgrade_orbitallauncher")
          ) {
            mods.push({
              file: gwaioUnits.orbitalFabber,
              path: "buildable_types",
              op: "replace",
              value: "Orbital & FactoryBuild | FabOrbBuild - Factory",
            });
          } else {
            mods.push({
              file: gwaioUnits.orbitalFabber,
              path: "buildable_types",
              op: "replace",
              value: "Orbital & FactoryBuild & Basic | FabOrbBuild - Factory",
            });
          }

          inventory.addMods(mods);

          var aiMods = [
            {
              type: "fabber",
              op: "load",
              value: "gwaio_start_rapid.json",
            },
            {
              type: "factory",
              op: "load",
              value: "gwaio_start_rapid.json",
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "BasicAirFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 376,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "BasicBotFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 376,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "BasicVehicleFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 376,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "BasicNavalFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 376,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "OrbitalLauncher",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 485,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "BasicAirFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 515,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "BasicBotFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 515,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "BasicVehicleFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 515,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "BasicNavalFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 515,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "OrbitalLauncher",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 486,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "AdvancedAirFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 477,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "AdvancedBotFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 477,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "AdvancedVehicleFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 477,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "AdvancedNavalFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 477,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "OrbitalFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 477,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "AdvancedAirFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 525,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "AdvancedBotFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 525,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "AdvancedVehicleFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 525,
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "AdvancedNavalFactory",
              idToMod: "priority",
              value: 0,
              refId: "priority",
              refValue: 525,
            },
          ];
          inventory.addAIMods(aiMods);
        } else {
          inventory.maxCards(inventory.maxCards() + 1);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        gwaioBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      gwaioCards.applyDulls(CARD, inventory);
    },
  };
});
