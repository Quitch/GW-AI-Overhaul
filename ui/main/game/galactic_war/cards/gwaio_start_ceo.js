define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "cards/gwaio_faction_cluster",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_functions.js",
], function (module, GWCStart, gwaioBank, gwaioFactionCluster, gwaioFunctions) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:CEO Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Enjoy an immediate buff to your basic economy structures, but short-term thinking means you can never access the advanced economy. Win the war while the quarterly returns still look hot."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:CEO Commander",
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
            gwaioFactionCluster.buff(inventory);
          var mods = [
            {
              file: "/pa/units/land/energy_plant/energy_plant.json",
              path: "production.energy",
              op: "multiply",
              value: 1.25,
            },
            {
              file: "/pa/units/land/metal_extractor/metal_extractor.json",
              path: "production.metal",
              op: "multiply",
              value: 1.25,
            },
          ];
          inventory.addMods(mods);
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
          inventory.removeUnits([
            "/pa/units/land/energy_plant_adv/energy_plant_adv.json",
            "/pa/units/land/metal_extractor_adv/metal_extractor_adv.json",
            "/pa/units/orbital/mining_platform/mining_platform.json",
          ]);
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
