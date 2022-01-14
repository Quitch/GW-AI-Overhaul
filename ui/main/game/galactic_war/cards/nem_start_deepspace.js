define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwaioBank, gwaioCards, gwaioUnits, gwaioGroups) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Space Excavation Commander"),
    icon: function () {
      return gwaioCards.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Modifies Jigs to allow building them anywhere, at the expense of not being able to build other resource structures. They are 75% cheaper but produce 30% less metal and energy and do 90% less damage on death. Orbital fabricators can build all basic structures. Contains all basic and advanced orbital units but can never build Omegas, any resource generating unit or structure, or Sub Commanders."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Space Excavation Commander",
      };
    },
    deal: gwaioCards.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          inventory.addUnits(gwaioGroups.orbitalAdvanced);

          inventory.addMods([
            {
              file: gwaioUnits.jig,
              path: "build_metal_cost",
              op: "multiply",
              value: 0.25,
            },
            {
              file: gwaioUnits.jig,
              path: "area_build_separation",
              op: "replace",
              value: 12,
            },
            {
              file: gwaioUnits.jig,
              path: "production.energy",
              op: "multiply",
              value: 0.7,
            },
            {
              file: gwaioUnits.jig,
              path: "production.metal",
              op: "multiply",
              value: 0.7,
            },
            {
              file: gwaioUnits.jig,
              path: "build_restrictions",
              op: "replace",
              value: "none",
            },
            {
              file: gwaioUnits.jig,
              path: "description",
              op: "replace",
              value:
                "!LOC:Orbital Mining Platform - This modified platform can extract metal from solid-state crust, but at a decreased rate.",
            },
            {
              file: gwaioUnits.jig,
              path: "model.animations",
              op: "replace",
              value: {},
            },
            {
              file: gwaioUnits.jigDeath,
              path: "damage",
              op: "multiply",
              value: 0.1,
            },
            {
              file: gwaioUnits.orbitalFabber,
              path: "buildable_types",
              op: "add",
              value: " | FabBuild",
            },
          ]);

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
          var aiMods = _.map(structures, function (structure) {
            return {
              type: "fabber",
              op: "append",
              toBuild: structure,
              idToMod: "builders",
              value: "OrbitalFabber",
            };
          });
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
      var units = [
        gwaioUnits.energyPlantAdvanced,
        gwaioUnits.energyPlant,
        gwaioUnits.metalExtractorAdvanced,
        gwaioUnits.metalExtractor,
        gwaioUnits.omega,
        gwaioUnits.solarArray,
      ];
      gwaioCards.applyDulls(CARD, inventory, units);
    },
  };
});
