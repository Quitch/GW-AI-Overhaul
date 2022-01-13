define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GW, GWCStart, gwaioCards, gwaioUnits, gwaioGroups) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Orbital Commander"),
    icon: function () {
      return gwaioCards.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The Orbital Commander loadout contains all orbital units and factories."
    ),
    deal: gwaioCards.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        // Make sure we only do the start buff/dull once
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          inventory.addUnits(gwaioGroups.orbital);
          inventory.addMods([
            {
              file: gwaioUnits.deepSpaceOrbitalRadar,
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_CmdBuild",
            },
            {
              file: gwaioUnits.orbitalFabber,
              path: "buildable_types",
              op: "add",
              value: " | FabBuild",
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
      gwaioCards.applyDulls(CARD, inventory);
    },
  };
});
