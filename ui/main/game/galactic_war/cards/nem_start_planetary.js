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
    summarize: _.constant("!LOC:Planetary Excavation Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Modifies Metal Extractors to enable building them anywhere at 150% the cost and 50% efficiency. Starts with basic vehicles."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Planetary Excavation Commander",
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
          if (inventory.getTag("global", "playerFaction") === 4)
            inventory.addMods(gwaioTech.clusterCommanders);
          inventory.addUnits([
            "/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json",
            "/pa/units/land/tank_armor/tank_armor.json",
            "/pa/units/land/tank_hover/tank_hover.json",
            "/pa/units/land/tank_light_laser/tank_light_laser.json",
            "/pa/units/land/vehicle_factory/vehicle_factory.json",
          ]);
          var mods = [];
          var units = [
            "/pa/units/land/metal_extractor_adv/metal_extractor_adv.json",
            "/pa/units/land/metal_extractor/metal_extractor.json",
          ];
          units.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "build_metal_cost",
                op: "multiply",
                value: 1.5,
              },
              {
                file: unit,
                path: "production.metal",
                op: "multiply",
                value: 0.5,
              },
              {
                file: unit,
                path: "feature_requirements",
                op: "replace",
                value: "none",
              }
            );
          });
          mods.push({
            file: "/pa/units/land/metal_extractor/metal_extractor.json",
            path: "description",
            op: "replace",
            value:
              "!LOC:Basic Manufacturing - This modified version of the Metal Extractor can be placed anywhere, but costs more and produces at a decreased rate. Cannot stack with the Advanced Metal Extractor. Produces metal.",
          });
          mods.push({
            file: "/pa/units/land/metal_extractor_adv/metal_extractor_adv.json",
            path: "description",
            op: "replace",
            value:
              "!LOC:Advanced Manufacturing - This modified version of the Advanced Metal Extractor can be placed anywhere, but costs more and produces at a decreased rate. Cannot stack with the basic Metal Extractor. Produces metal.",
          });
          inventory.addMods(mods);

          inventory.addAIMods([
            {
              type: "fabber",
              op: "replace",
              toBuild: "BasicMetalExtractor",
              idToMod: "priority",
              value: 0,
              refId: "task_type",
              refValue: "AreaBuild",
            },
            {
              type: "fabber",
              op: "replace",
              toBuild: "AdvancedMetalExtractor",
              idToMod: "priority",
              value: 0,
              refId: "task_type",
              refValue: "AreaBuild",
            },
            {
              type: "fabber",
              op: "remove",
              toBuild: "BasicMetalExtractor",
              value: {
                test_type: "CanFindMetalSpotToBuildBasic",
                boolean: true,
              },
            },
            {
              type: "fabber",
              op: "remove",
              toBuild: "AdvancedMetalExtractor",
              value: {
                test_type: "CanFindMetalSpotToBuildAdvanced",
                boolean: true,
              },
            },
            {
              type: "fabber",
              op: "new",
              toBuild: "BasicMetalExtractor",
              idToMod: "", // add to every test array
              value: {
                test_type: "CanFindPlaceToBuild",
                string0: "BasicMetalExtractor",
              },
            },
            {
              type: "fabber",
              op: "new",
              toBuild: "AdvancedMetalExtractor",
              idToMod: "", // add to every test array
              value: {
                test_type: "CanFindPlaceToBuild",
                string0: "AdvancedMetalExtractor",
              },
            },
          ]);
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
