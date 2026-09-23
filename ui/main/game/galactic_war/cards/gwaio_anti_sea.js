define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_factories.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
], function (gwoCardFactories, gwoCard) {
  return gwoCardFactories.antiTechCard({
    name: "!LOC:Anti-Ship Ammo Tech",
    description:
      "!LOC:Anti-Ship Ammo Tech doubles all damage you deal to naval vessels but halves damage to hover units.",
    icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png",
    counter: "gwaio_anti_hover",
    chance: function (inventory) {
      return gwoCard.navalWeight(inventory, 40, 15);
    },
    armour: {
      AT_Hover: 0.5,
      AT_Naval: 2,
    },
  });
});
