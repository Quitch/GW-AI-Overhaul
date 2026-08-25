define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GW, GWCStart, gwoCard, gwoUnit, gwoGroup) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Artillery Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The Artillery Commander loadout contains all artillery units and reduces costs of those structures by 75%. It also enables the Commander to build radar, double barreled turrets and basic artillery turrets."
    ),
    hint: _.constant({
      icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
      description: "!LOC:Artillery Commander",
    }),
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);
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
          var aiMods = _.map(structures, function (structure) {
            return {
              type: "fabber",
              op: "append",
              toBuild: structure,
              idToMod: "builders",
              value: "Commander",
              matchAll: true,
            };
          });
          inventory.addAIMods(aiMods);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        GW.bank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      gwoCard.applyDulls(CARD, inventory);
    },
  };
});
