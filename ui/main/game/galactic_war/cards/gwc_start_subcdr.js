define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GW, GWCStart, gwoCard, gwoUnit) {
  const CARD = { id: /[^/]+$/.exec(module.id).pop() };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:General Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The General Commander loadout contains very limited mobile forces and only two data banks. However, the loadout comes with two Sub Commanders that accompany you into each battle."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:General Commander",
      };
    },
    getContext: function (galaxy, inventory) {
      return {
        faction: inventory.getTag("global", "playerFaction") || 0,
      };
    },
    deal: gwoCard.startCard,
    buff: function (inventory, context) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          inventory.addUnits([
            gwoUnit.ant,
            gwoUnit.skitter,
            gwoUnit.vehicleFabber,
            gwoUnit.vehicleFactory,
          ]);
        }
        // Support for GWO v4.2.2 and earlier
        if (
          inventory.cards()[0].id === "gwc_start_subcdr" &&
          inventory.cards()[0].minions
        ) {
          _.forEach(context.minions, function (minion) {
            inventory.minions.push(minion);
          });
          const minionSpecs = _.compact(_.pluck(context.minions, "commander"));
          inventory.addUnits(minionSpecs);
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
