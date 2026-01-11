define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit, gwoGroup) {
  const CARD = { id: /[^/]+$/.exec(module.id).pop() };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Planetary Excavation Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Modifies Metal Extractors to enable building them anywhere at 150% the cost and 50% efficiency. Starts with basic vehicles."
    ),
    hint: _.constant({
      icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
      description: "!LOC:Planetary Excavation Commander",
    }),
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);
          inventory.addUnits(gwoGroup.vehiclesBasic);

          const units = [
            gwoUnit.metalExtractorAdvanced,
            gwoUnit.metalExtractor,
          ];
          const mods = _.flatten(
            _.map(units, function (unit) {
              return [
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
                },
              ];
            })
          );
          mods.push(
            {
              file: gwoUnit.metalExtractor,
              path: "description",
              op: "replace",
              value:
                "!LOC:Basic Manufacturing - This modified version of the Metal Extractor can be placed anywhere, but costs more and produces at a decreased rate. Cannot stack with the Advanced Metal Extractor. Produces metal.",
            },
            {
              file: gwoUnit.metalExtractorAdvanced,
              path: "description",
              op: "replace",
              value:
                "!LOC:Advanced Manufacturing - This modified version of the Advanced Metal Extractor can be placed anywhere, but costs more and produces at a decreased rate. Cannot stack with the basic Metal Extractor. Produces metal.",
            }
          );
          inventory.addMods(mods);

          const structures = ["BasicMetalExtractor", "AdvancedMetalExtractor"];
          const aiMods = [
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
          ];
          _.forEach(structures, function (structure) {
            aiMods.push(
              {
                type: "fabber",
                op: "replace",
                toBuild: structure,
                idToMod: "priority",
                value: 0,
                refId: "task_type",
                refValue: "AreaBuild",
              },
              {
                type: "fabber",
                op: "new",
                toBuild: structure,
                idToMod: "", // add to every test array
                value: {
                  test_type: "CanFindPlaceToBuild",
                  string0: structure,
                },
              }
            );
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
      gwoCard.applyDulls(CARD, inventory);
    },
  };
});
