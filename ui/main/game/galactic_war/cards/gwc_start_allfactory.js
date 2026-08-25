define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (module, GW, GWCStart, gwoCard, gwoUnit, gwoGroup) => {
  const CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  return {
    visible: () => false,
    summarize: () => "!LOC:Assault Commander",
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: () =>
      "!LOC:The Assault Commander loadout contains all basic factories and units but no basic defenses.",
    hint: _.constant({
      icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
      description: "!LOC:Assault Commander",
    }),
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        let buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);
          inventory.addUnits(
            gwoGroup.airBasic.concat(
              gwoGroup.botsBasic,
              gwoGroup.vehiclesBasic,
            ),
          );
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        GW.bank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      const mineGranted = _.some(
        [
          "gwaio_upgrade_bumblebee",
          "gwaio_upgrade_grenadier",
          "gwaio_upgrade_sheller",
        ],
        (cardId) => inventory.hasCard(cardId),
      );
      const restricted = mineGranted
        ? _.without(gwoGroup.structuresDefencesBasic, gwoUnit.landMine)
        : gwoGroup.structuresDefencesBasic;
      gwoCard.applyDulls(CARD, inventory, restricted);
    },
  };
});
