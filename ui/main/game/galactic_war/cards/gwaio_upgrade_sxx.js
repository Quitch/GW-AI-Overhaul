define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:SXX-1304 Laser Platform Upgrade Tech removes the delay between orbital laser platforms arriving at a planet and responding to orders.",
      ),
    ),
  ),

  summarize: () => "!LOC:SXX-1304 Laser Platform Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_speed" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(gwoCard.hasUnit(inventory.units(), gwoUnit.sxx));
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods(
      gwoCard.mods(gwoUnit.sxx, "replace", {
        planetary_arrival_cooldown_time: 0,
      }),
    );
  },

  dull: function () {},
}));
