define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Orbital Factory Upgrade Tech decreases advanced orbital unit costs by 25% but also decreases the factory's health by 50%."
        )
      )
    ),
    summarize: _.constant("!LOC:Orbital Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_orbital",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.orbitalFactory)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .flatMapMods(gwoGroup.orbitalAdvancedMobile, "multiply", {
            build_metal_cost: 0.75,
          })
          .concat(
            gwoCard.mods(gwoUnit.orbitalFactory, "multiply", {
              max_health: 0.5,
            })
          )
      );
    },
    dull: function () {},
  };
});
