define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GW, GWCStart, gwaioFunctions, gwaioUnits) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Artillery Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
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
        // Make sure we only do the start buff/dull once
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          gwaioFunctions.setupCluster(inventory);
          inventory.addUnits([
            gwaioUnits.holkins,
            gwaioUnits.pelter,
            gwaioUnits.lob,
            gwaioUnits.dox,
          ]);
          var units = [
            gwaioUnits.holkins,
            gwaioUnits.pelter,
            gwaioUnits.lob,
            gwaioUnits.laserDefenseTower,
            gwaioUnits.radar,
          ];
          var mods = [];
          units.forEach(function (unit) {
            mods.push({
              file: unit,
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_CmdBuild",
            });
          });
          var costUnits = [
            gwaioUnits.holkins,
            gwaioUnits.pelter,
            gwaioUnits.lob,
          ];
          costUnits.forEach(function (unit) {
            mods.push({
              file: unit,
              path: "build_metal_cost",
              op: "multiply",
              value: 0.25,
            });
          });
          inventory.addMods(mods);

          inventory.addAIMods([
            {
              type: "factory",
              op: "append",
              toBuild: "BasicRadar",
              value: "Commander",
              idToMod: "builders",
            },
            {
              type: "factory",
              op: "append",
              toBuild: "BasicRadar",
              value: "UberCommander",
              idToMod: "builders",
            },
            {
              type: "factory",
              op: "append",
              toBuild: "BasicLandDefense",
              value: "Commander",
              idToMod: "builders",
            },
            {
              type: "factory",
              op: "append",
              toBuild: "BasicLandDefense",
              value: "UberCommander",
              idToMod: "builders",
            },
            {
              type: "factory",
              op: "append",
              toBuild: "BasicArtillery",
              value: "Commander",
              idToMod: "builders",
            },
            {
              type: "factory",
              op: "append",
              toBuild: "BasicArtillery",
              value: "UberCommander",
              idToMod: "builders",
            },
          ]);
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
      gwaioFunctions.applyDulls(CARD, inventory);
    },
  };
});
