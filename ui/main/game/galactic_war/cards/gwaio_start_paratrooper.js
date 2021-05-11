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
    summarize: _.constant("!LOC:Paratrooper Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Contains no basic factories, just Lobs and Unit Cannons built by the commander. Strike from the skies, brothers!"
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Paratrooper Commander",
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
          var lob =
            "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json";
          var unitCannon = "/pa/units/land/unit_cannon/unit_cannon.json";
          var mods = [
            {
              file: lob,
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_CmdBuild",
            },
            {
              file: unitCannon,
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_CmdBuild",
            },
          ];
          inventory.addMods(mods);
          inventory.addUnits([lob, unitCannon]);
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
