define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GW, GWCStart, gwoAI, gwoCard, gwoUnit, gwoGroup) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  var loadout = gwoCard.loadout(CARD, {
    bank: GW.bank,
    start: GWCStart,
    apply: function (inventory) {
      inventory.addUnits(gwoGroup.structuresArtillery.concat(gwoUnit.dox));

      var units = [
        gwoUnit.pelter,
        gwoUnit.lob,
        gwoUnit.laserDefenseTower,
        gwoUnit.radar,
      ];
      var costUnits = [gwoUnit.holkins, gwoUnit.pelter, gwoUnit.lob];
      inventory.addMods(
        gwoCard
          .flatMapMods(units, "push", { unit_types: "UNITTYPE_CmdBuild" })
          .concat(
            gwoCard.flatMapMods(costUnits, "multiply", {
              build_metal_cost: 0.25,
            })
          )
      );

      var structures = ["BasicRadar", "BasicLandDefense", "BasicArtillery"];
      inventory.addAIMods(
        gwoAI.builderAppendMods("fabber", structures, "Commander")
      );
    },
  });
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Artillery Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The Artillery Commander loadout contains all artillery units and reduces costs of those structures by 75%. It also enables the Commander to build radar, double barreled turrets and basic artillery turrets."
    ),
    hint: gwoCard.lockedHint("!LOC:Artillery Commander"),
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
