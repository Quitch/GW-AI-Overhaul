define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      `${loc(
        "!LOC:Barnacle Upgrade Tech allows the assisting of all builds by the support barge.",
      )} ${loc("!LOC:Disables the auto-repair feature.")}`,
    ),
  ),

  summarize: () => "!LOC:Barnacle Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_efficiency",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.barnacle),
      30,
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods(
      gwoCard.mods(gwoUnit.barnacleBuildArm, "replace", {
        can_only_assist_with_buildable_items: false,
        auto_repair: false,
      }),
    );
  },

  dull: function () {},
}));
