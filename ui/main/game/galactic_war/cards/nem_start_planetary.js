define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (module, GWCStart, gwoBank, gwoCard, gwoUnit, gwoGroup) => {
  const CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  const loadout = gwoCard.loadout(CARD, {
    bank: gwoBank,
    start: GWCStart,
    apply: function (inventory) {
      inventory.addUnits(gwoGroup.vehiclesBasic);

      const units = [gwoUnit.metalExtractorAdvanced, gwoUnit.metalExtractor];
      const mods = _.flatten(
        _.map(units, (unit) =>
          gwoCard
            .mods(unit, "multiply", {
              build_metal_cost: 1.5,
              "production.metal": 0.5,
            })
            .concat(
              gwoCard.mods(unit, "replace", {
                feature_requirements: "none",
              }),
            ),
        ),
      ).concat(
        gwoCard.mods(gwoUnit.metalExtractor, "replace", {
          description:
            "!LOC:Basic Manufacturing - This modified version of the Metal Extractor can be placed anywhere, but costs more and produces at a decreased rate. Cannot stack with the Advanced Metal Extractor. Produces metal.",
        }),
        gwoCard.mods(gwoUnit.metalExtractorAdvanced, "replace", {
          description:
            "!LOC:Advanced Manufacturing - This modified version of the Advanced Metal Extractor can be placed anywhere, but costs more and produces at a decreased rate. Cannot stack with the basic Metal Extractor. Produces metal.",
        }),
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
      _.forEach(structures, (structure) => {
        aiMods.push(
          {
            type: "fabber",
            op: "unset",
            toBuild: structure,
            idToMod: "task_type",
            refId: "task_type",
            refValue: "AreaBuild", // TITANS, Queller Uber and Silver
          },
          {
            type: "fabber",
            op: "new",
            toBuild: structure,
            idToMod: true, // a flag here: add to every test array
            value: {
              test_type: "CanFindPlaceToBuild",
              string0: structure,
            },
          },
        );
      });
      inventory.addAIMods(aiMods);
    },
  });
  return {
    visible: () => false,
    summarize: () => "!LOC:Planetary Excavation Commander",
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: () =>
      "!LOC:Modifies Metal Extractors to enable building them anywhere at 150% the cost and 50% efficiency. Starts with basic vehicles.",
    hint: gwoCard.lockedHint("!LOC:Planetary Excavation Commander"),
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
