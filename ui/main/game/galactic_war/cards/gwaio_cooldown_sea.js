define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_factories.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
], function (gwoCardFactories, gwoGroup, gwoCard) {
  return gwoCardFactories.cooldownCard({
    name: "!LOC:Naval Cooldown Tech",
    description:
      "!LOC:Naval Cooldown Tech halves the cooldown time between builds for all naval factories.",
    icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png",
    audio: "/VO/Computer/gw/board_tech_available_sea",
    factories: gwoGroup.navalFactories,
    chance: function (inventory) {
      return gwoCard.navalWeight(inventory, 70);
    },
  });
});
