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
    summarize: _.constant("!LOC:Planetary Excavation Commander"),
    icon: function () {
      return gwaioCards.loadoutIcon(CARD.id);
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
    deal: gwaioCards.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          gwaioCards.setupCluster(inventory);
          inventory.addUnits([
            gwaioUnits.spinner,
            gwaioUnits.inferno,
            gwaioUnits.drifter,
            gwaioUnits.ant,
            gwaioUnits.vehicleFactory,
          ]);
          var mods = [];
          var units = [
            gwaioUnits.metalExtractorAdvanced,
            gwaioUnits.metalExtractor,
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
            file: gwaioUnits.metalExtractor,
            path: "description",
            op: "replace",
            value:
              "!LOC:Basic Manufacturing - This modified version of the Metal Extractor can be placed anywhere, but costs more and produces at a decreased rate. Cannot stack with the Advanced Metal Extractor. Produces metal.",
          });
          mods.push({
            file: gwaioUnits.metalExtractorAdvanced,
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
      gwaioCards.applyDulls(CARD, inventory);
    },
  };
});
