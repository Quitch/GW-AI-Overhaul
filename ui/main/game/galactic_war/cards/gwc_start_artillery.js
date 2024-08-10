define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GW, GWCStart, gwoCard, gwoUnit, gwoGroup) {
  const CARD = { id: /[^/]+$/.exec(module.id).pop() };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Artillery Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The Artillery Commander loadout contains all artillery units and reduces costs of those structures by 75%. It also enables the Commander to build radar, double barreled turrets and basic artillery turrets."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Artillery Commander",
      };
    },
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        // Make sure we only do the start buff/dull once
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          inventory.addUnits(gwoGroup.structuresArtillery.concat(gwoUnit.dox));

          const mods = [];
          const units = [
            gwoUnit.pelter,
            gwoUnit.lob,
            gwoUnit.laserDefenseTower,
            gwoUnit.radar,
          ];
          _.forEach(units, function (unit) {
            mods.push({
              file: unit,
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_CmdBuild",
            });
          });
          const costUnits = [gwoUnit.holkins, gwoUnit.pelter, gwoUnit.lob];
          _.forEach(costUnits, function (unit) {
            mods.push({
              file: unit,
              path: "build_metal_cost",
              op: "multiply",
              value: 0.25,
            });
          });
          inventory.addMods(mods);

          const structures = [
            "BasicRadar",
            "BasicLandDefense",
            "BasicArtillery",
          ];
          const aiMods = _.map(structures, function (structure) {
            return {
              type: "factory",
              op: "append",
              toBuild: structure,
              idToMod: "builders",
              value: "Commander",
            };
          });
          inventory.addAIMods(aiMods);
        } else {
          // Don't clog up a slot.
          inventory.maxCards(inventory.maxCards() + 1);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        // Don't clog up a slot.
        inventory.maxCards(inventory.maxCards() + 1);
        GW.bank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      gwoCard.applyDulls(CARD, inventory);
    },
  };
});
