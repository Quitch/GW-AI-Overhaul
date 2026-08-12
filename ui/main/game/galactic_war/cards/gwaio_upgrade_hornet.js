define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Hornet Upgrade Tech adds splash damage to the tactical bomber's attacks.",
      ),
    ),
  ),

  summarize: () => "!LOC:Hornet Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.hornet),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods(
      gwoCard.mods(gwoUnit.hornetAmmo, "replace", {
        splash_damage: 1000,
        splash_radius: 12,
      }),
    );
  },

  dull: function () {},
}));
