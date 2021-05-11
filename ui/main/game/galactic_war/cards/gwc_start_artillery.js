define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "cards/gwaio_faction_cluster",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (module, GW, GWCStart, gwaioFactionCluster, gwaioFunctions) {
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
          if (inventory.getTag("global", "playerFaction") === 4)
            gwaioFactionCluster.buff(inventory);
          inventory.addUnits([
            "/pa/units/land/artillery_long/artillery_long.json",
            "/pa/units/land/artillery_short/artillery_short.json",
            "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json",
          ]);
          var units = [
            "/pa/units/land/laser_defense/laser_defense.json",
            "/pa/units/land/artillery_short/artillery_short.json",
            "/pa/units/land/artillery_long/artillery_long.json",
            "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json",
            "/pa/units/land/radar/radar.json",
            "/pa/units/orbital/orbital_launcher/orbital_launcher.json",
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
            "/pa/units/land/artillery_short/artillery_short.json",
            "/pa/units/land/artillery_long/artillery_long.json",
            "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json",
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
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          // Perform dulls here

          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
