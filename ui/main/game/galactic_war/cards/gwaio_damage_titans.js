define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Titan Ammunition Tech increases the damage of all titans by 25%.",

  summarize: () => "!LOC:Titan Ammunition Tech",

  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_enable_titans.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.conditionalDeal(
      gwoCard.hasUnit(inventory.units(), gwoGroup.titansMobile),
      70,
    );
  },

  buff: function (inventory) {
    inventory.addMods(
      gwoCard.flatMapMods(
        gwoGroup.titansAmmo,
        "multiply",
        gwoCard.paths.damage,
        1.25,
      ),
    );
  },

  dull: function () {},
}));
