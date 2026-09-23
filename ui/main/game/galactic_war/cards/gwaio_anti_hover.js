define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_factories.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
], function (gwoCardFactories, gwoCard) {
  return gwoCardFactories.antiTechCard({
    name: "!LOC:Anti-Hover Ammo Tech",
    description:
      "!LOC:Anti-Hover Ammo Tech doubles all damage you deal to hover units but halves damage to naval vessels.",
    icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png",
    counter: "gwaio_anti_sea",
    chance: function (inventory) {
      return gwoCard.navalWeight(inventory, 40, 15);
    },
    armour: {
      AT_Hover: 2,
      AT_Naval: 0.5,
    },
  });
});
