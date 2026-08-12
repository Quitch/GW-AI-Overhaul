define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Helios Upgrade Tech removes the delay between the invasion titan arriving at a planet and responding to orders and increases its health by 50%.",
      ),
    ),
  ),

  summarize: () => "!LOC:Helios Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_enable_titans_upgrade.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_armor" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.helios),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods([
      {
        file: gwoUnit.helios,
        path: "planetary_arrival_cooldown_time",
        op: "replace",
        value: 0,
      },
      {
        file: gwoUnit.helios,
        path: "max_health",
        op: "multiply",
        value: 1.5,
      },
    ]);
  },

  dull: function () {},
}));
