define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "cards/gwc_storage_and_buff",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GW, GWCStart, GWCStorage, gwoCard, gwoUnit) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  var loadout = gwoCard.loadout(CARD, {
    bank: GW.bank,
    start: GWCStart,
    apply: function (inventory) {
      GWCStorage.buff(inventory);
    },
    dulls: [gwoUnit.inferno, gwoUnit.vanguard],
  });
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Storage Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Starts with a 25% boost to metal and energy production and is able to build metal and energy storage. Unable to build close-range armored tanks."
    ),
    hint: gwoCard.lockedHint("!LOC:Storage Commander"),
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
