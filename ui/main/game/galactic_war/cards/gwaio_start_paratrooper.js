define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "cards/gwaio_faction_cluster",
], function (module, GWCStart, gwaioBank, gwaioFactionCluster) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Paratrooper Commander"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/shared/img/red-commander.png"
    ),
    describe: _.constant(
      "!LOC:Contains no basic factories, just Lobs and Unit Cannons built by the commander. Strike from the skies, brothers!"
    ),
    hint: function () {
      return {
        icon:
          "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
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
          var lob = [
            "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json",
          ];
          var unitCannon = ["/pa/units/land/unit_cannon/unit_cannon.json"];
          var units = lob.concat(unitCannon);
          inventory.addUnits(units);
          var mods = [
            {
              file: lob,
              path: "unit_types",
              op: "replace",
              value: [
                "UNITTYPE_Structure",
                "UNITTYPE_Artillery",
                "UNITTYPE_Defense",
                "UNITTYPE_FabBuild",
                "UNITTYPE_Basic",
                "UNITTYPE_CmdBuild",
              ],
            },
            {
              file: unitCannon,
              path: "unit_types",
              op: "replace",
              value: [
                "UNITTYPE_Structure",
                "UNITTYPE_Factory",
                "UNITTYPE_Advanced",
                "UNITTYPE_Artillery",
                "UNITTYPE_FabAdvBuild",
                "UNITTYPE_Important",
                "UNITTYPE_CmdBuild",
              ],
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
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
