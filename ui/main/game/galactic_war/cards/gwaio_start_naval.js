define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (module, GW, GWCStart, gwoCard, gwoGroup) => {
  const CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  const loadout = gwoCard.loadout(CARD, {
    bank: GW.bank,
    start: GWCStart,
    apply: function (inventory) {
      inventory.addUnits(gwoGroup.naval);
    },
  });
  return {
    visible: () => false,
    summarize: () => "!LOC:Naval Commander",
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: () =>
      "!LOC:The Naval Commander loadout contains all naval factories. Increases the amount of water and lava on eligible planets.",
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
