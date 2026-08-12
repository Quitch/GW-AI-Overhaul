define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Kraken Upgrade Tech increases the range of the advanced submarine's missiles by 200%.",
      ),
    ),
  ),

  summarize: () => "!LOC:Kraken Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.kraken),
      30,
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods(
      gwoCard.mods(gwoUnit.krakenMissile, "multiply", {
        max_range: 3,
      }),
    );
  },

  dull: function () {},
}));
