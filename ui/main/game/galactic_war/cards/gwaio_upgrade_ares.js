define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Ares Upgrade Tech increases the range of the rolling fortress by 25%."
        )
      )
    ),
    summarize: _.constant("!LOC:Ares Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_enable_titans_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.ares)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.aresWeapon, "multiply", { max_range: 1.25 })
          .concat(
            gwoCard.mods(gwoUnit.aresWeapon, "replace", {
              pitch_range: 89,
              arc_type: "ARC_high",
            }),
            gwoCard.mods(gwoUnit.aresSecondary, "multiply", {
              max_range: 1.25,
            }),
            gwoCard.mods(gwoUnit.aresSecondaryAmmo, "replace", {
              max_velocity: 200,
            })
          )
      );
    },
    dull: function () {},
  };
});
