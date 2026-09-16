define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Titan Armour Tech increases the health of all Titans by 50%.",

  summarize: () => "!LOC:Titan Armour Tech",

  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_enable_titans.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_armor" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.conditionalDeal(
      gwoCard.hasUnit(inventory.units(), gwoGroup.titans),
      70,
    );
  },

  buff: function (inventory) {
    inventory.addMods(
      gwoCard.flatMapMods(gwoGroup.titans, "multiply", { max_health: 1.5 }),
    );
  },

  dull: function () {},
}));
