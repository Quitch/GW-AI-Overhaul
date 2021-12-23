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
    summarize: _.constant("!LOC:Assault Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The Assault Commander loadout contains all basic factories and units but no basic defenses."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Assault Commander",
      };
    },
    deal: gwaioFunctions.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        // Make sure we only do the start buff/dull once
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          gwaioFunctions.setupCluster(inventory);
          inventory.addUnits([
            gwaioUnits.airFactory,
            gwaioUnits.firefly,
            gwaioUnits.bumblebee,
            gwaioUnits.hummingbird,
            gwaioUnits.icarus,
            gwaioUnits.pelican,
            gwaioUnits.spinner,
            gwaioUnits.dox,
            gwaioUnits.stryker,
            gwaioUnits.stinger,
            gwaioUnits.boom,
            gwaioUnits.botFactory,
            gwaioUnits.grenadier,
            gwaioUnits.spark,
            gwaioUnits.stitch,
            gwaioUnits.inferno,
            gwaioUnits.drifter,
            gwaioUnits.ant,
            gwaioUnits.vehicleFactory,
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
      var units = [
        gwaioUnits.galata,
        gwaioUnits.wall,
        gwaioUnits.singleLaserDefenseTower,
        gwaioUnits.laserDefenseTower,
        gwaioUnits.torpedoLauncherAdvanced,
        gwaioUnits.torpedoLauncher,
      ];
      gwaioFunctions.applyDulls(CARD, inventory, units);
    },
  };
});
