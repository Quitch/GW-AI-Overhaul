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
    const mods = _.flatten(
      _.map(gwoGroup.titansAmmo, (ammo) => [
        {
          file: ammo,
          path: "damage",
          op: "multiply",
          value: 1.25,
        },
        {
          file: ammo,
          path: "splash_damage",
          op: "multiply",
          value: 1.25,
        },
      ]),
    );
    inventory.addMods(mods);
  },

  dull: function () {},
}));
