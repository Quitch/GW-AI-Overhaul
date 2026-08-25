define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Piranha Upgrade Tech changes the gunboat into a hover unit, allowing it to cross land and lava."
        )
      )
    ),
    summarize: _.constant("!LOC:Piranha Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_speed" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.piranha),
        30
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.piranha, "push", { unit_types: "UNITTYPE_Hover" })
          .concat(
            gwoCard.mods(gwoUnit.piranha, "replace", {
              "navigation.type": "hover",
            })
          )
      );
    },
    dull: function () {},
  };
});
