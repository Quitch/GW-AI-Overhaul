define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit, gwoGroup) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Space Excavation Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Modifies Jigs to allow building them anywhere, at the expense of not being able to build other resource structures. They are 75% cheaper but produce 30% less metal and energy and do 90% less damage on death. Orbital fabricators can build all basic structures. Contains all basic and advanced orbital units but can never build Omegas, any resource generating unit or structure, or Sub Commanders."
    ),
    hint: _.constant({
      icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
      description: "!LOC:Space Excavation Commander",
    }),
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);
          inventory.addUnits(gwoGroup.orbitalAdvanced);

          inventory.addMods(
            gwoCard
              .mods(gwoUnit.jig, "multiply", { build_metal_cost: 0.25 })
              .concat(
                gwoCard.mods(gwoUnit.jig, "replace", {
                  area_build_separation: 12,
                }),
                gwoCard.mods(gwoUnit.jig, "multiply", {
                  "production.energy": 0.7,
                  "production.metal": 0.7,
                }),
                gwoCard.mods(gwoUnit.jig, "replace", {
                  build_restrictions: "none",
                  description:
                    "!LOC:Orbital Mining Platform - This modified platform can extract metal from solid-state crust, but at a decreased rate.",
                  "model.animations": {},
                }),
                gwoCard.mods(gwoUnit.jigDeath, "multiply", { damage: 0.1 }),
                gwoCard.mods(gwoUnit.orbitalFabber, "add", {
                  buildable_types: " | FabBuild & Custom58",
                })
              )
          );

          var structures = [
            "BasicAirDefense",
            "BasicAirFactory",
            "BasicArtillery",
            "BasicBotFactory",
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
              matchAll: true,
            };
          });
          inventory.addAIMods(aiMods);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        gwoBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      var units = [
        gwoUnit.energyPlantAdvanced,
        gwoUnit.energyPlant,
        gwoUnit.metalExtractorAdvanced,
        gwoUnit.metalExtractor,
        gwoUnit.omega,
        gwoUnit.solarArray,
        gwoUnit.icarus,
      ];
      gwoCard.applyDulls(CARD, inventory, units);
    },
  };
});
