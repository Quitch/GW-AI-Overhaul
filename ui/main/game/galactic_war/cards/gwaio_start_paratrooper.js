define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/js/bank.js",
], function (module, GWCStart, gwaioBank) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Paratrooper Commander"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/shared/img/red-commander.png"
    ),
    describe: _.constant(
      "!LOC:Contains no basic factories, but Lobs and Unit Cannons can be built by the commander. Strike from the skies, brothers!"
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
        // Make sure we only do the start buff/dull once
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          var lob = [
            "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json",
          ];
          var unitCannon = ["/pa/units/land/unit_cannon/unit_cannon.json"];
          var units = lob.concat(unitCannon);
          inventory.addUnits(units);
          var mods = [];
          mods.push({
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
          });
          mods.push({
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
        gwaioBank.addStartCard(CARD);
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
