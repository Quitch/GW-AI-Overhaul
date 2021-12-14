define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/tech.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (module, GWCStart, gwaioBank, gwaioTech, gwaioFunctions) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Rapid Deployment Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
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
    deal: function () {
      return {
        params: {
          allowOverflow: true,
        },
        chance: 0,
      };
    },
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          gwaioFunctions.setupCluster(inventory);

          var mods = [
            {
              file: "/pa/units/air/air_factory/air_factory.json",
              path: "buildable_types",
              op: "replace",
              value: "(Air & Fabber & Basic & Mobile) & FactoryBuild",
            },
            {
              file: "/pa/units/air/air_factory_adv/air_factory_adv.json",
              path: "buildable_types",
              op: "replace",
              value: "(Air & Fabber & Mobile) & FactoryBuild",
            },
            {
              file: "/pa/units/land/bot_factory/bot_factory.json",
              path: "buildable_types",
              op: "replace",
              value: "(Bot & Fabber & Basic & Mobile) & FactoryBuild",
            },
            {
              file: "/pa/units/land/bot_factory_adv/bot_factory_adv.json",
              path: "buildable_types",
              op: "replace",
              value: "(Bot & Fabber & Mobile) & FactoryBuild",
            },
            {
              file: "/pa/units/land/vehicle_factory/vehicle_factory.json",
              path: "buildable_types",
              op: "replace",
              value: "(Tank & Fabber & Basic & Mobile) & FactoryBuild",
            },
            {
              file: "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json",
              path: "buildable_types",
              op: "replace",
              value: "(Tank & Fabber & Mobile) & FactoryBuild",
            },
            {
              file: "/pa/units/sea/naval_factory/naval_factory.json",
              path: "buildable_types",
              op: "replace",
              value: "(Naval & Fabber & Basic & Mobile) & FactoryBuild",
            },
            {
              file: "/pa/units/sea/naval_factory_adv/naval_factory_adv.json",
              path: "buildable_types",
              op: "replace",
              value: "(Naval & Fabber & Mobile) & FactoryBuild",
            },
            {
              file: "/pa/units/orbital/orbital_launcher/orbital_launcher.json",
              path: "buildable_types",
              op: "replace",
              value: "(Orbital & Fabber & Basic & Mobile) & FactoryBuild",
            },
            {
              file: "/pa/units/orbital/orbital_factory/orbital_factory.json",
              path: "buildable_types",
              op: "replace",
              value: "(Orbital & Fabber & Basic & Mobile) & FactoryBuild",
            },
            {
              file: "/pa/units/air/fabrication_aircraft/fabrication_aircraft.json",
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Basic & Air | Land & Structure & Basic - Factory | Factory & Advanced & Air | FabBuild - Factory",
            },
            {
              file: "/pa/units/air/fabrication_aircraft/fabrication_aircraft.json",
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Basic & Air | Land & Structure & Basic - Factory | Factory & Advanced & Air | FabBuild - Factory",
            },
            {
              file: "/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv.json",
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Air | Land & Structure & Advanced - Factory | FabAdvBuild | FabBuild - Factory | Titan & Air",
            },
            {
              file: "/pa/units/land/fabrication_bot/fabrication_bot.json",
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Basic & Bot | Land & Structure & Basic - Factory | Factory & Advanced & Bot & Land | FabBuild - Factory",
            },
            {
              file: "/pa/units/land/fabrication_bot_adv/fabrication_bot_adv.json",
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Bot | Land & Structure & Advanced - Factory | FabAdvBuild | FabBuild - Factory | Titan & Bot",
            },
            {
              file: "/pa/units/land/bot_support_commander/bot_support_commander.json",
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Bot | Land & Structure & Advanced - Factory | FabAdvBuild | FabBuild - Factory | Titan & Bot",
            },
            {
              file: "/pa/units/land/fabrication_vehicle/fabrication_vehicle.json",
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Basic & Tank | Land & Structure & Basic - Factory | Factory & Land & Tank & Advanced | FabBuild - Factory",
            },
            {
              file: "/pa/units/land/fabrication_vehicle_adv/fabrication_vehicle_adv.json",
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Tank | Structure & Land & Advanced - Factory | FabAdvBuild | FabBuild - Factory | Titan & (Tank | Naval)",
            },
            {
              file: "/pa/units/sea/fabrication_ship/fabrication_ship.json",
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Basic & Naval | Naval & Structure & Basic - Factory | Naval & Factory & Advanced | FabBuild - Factory",
            },
            {
              file: "/pa/units/land/fabrication_ship_adv/fabrication_ship_adv.json",
              path: "buildable_types",
              op: "replace",
              value:
                "Mobile & Naval | Naval & Structure & Advanced - Factory | FabAdvBuild | FabBuild - Factory",
            },
            // fix placement issues
            {
              file: "/pa/units/sea/attack_sub/attack_sub.json",
              path: "spawn_layers",
              op: "replace",
              value: "WL_DeepWater",
            },
            {
              file: "/pa/units/sea/nuclear_sub/nuclear_sub.json",
              path: "spawn_layers",
              op: "replace",
              value: "WL_DeepWater",
            },
            {
              file: "/pa/units/air/gunship/gunship.json",
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
              file: "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
              path: "buildable_types",
              op: "replace",
              value: "Orbital & FactoryBuild | FabOrbBuild - Factory",
            });
          } else {
            mods.push({
              file: "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
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
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
