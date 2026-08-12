define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc("!LOC:Atlas Upgrade Tech doubles the health of the seismic titan."),
    ),
  ),

  summarize: () => "!LOC:Atlas Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_enable_titans_upgrade.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_armor" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.atlas),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods(
      gwoCard.mods(gwoUnit.atlas, "multiply", {
        max_health: 2,
      }),
    );
  },

  dull: function () {},
}));
