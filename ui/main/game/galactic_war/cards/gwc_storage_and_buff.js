define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Efficiency Tech increases metal and energy production by 25%. Tech also grants metal and energy storage."
    ),
    summarize: _.constant("!LOC:Efficiency Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_storage_compression.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_economy",
    }),
    getContext: gwoCard.getContext,
    deal: function (system) {
      // A flat +25% to both resources compounds for the rest of the run, which put
      // this among the three heaviest cards in the deck at 250 - roughly one offer
      // in eighteen. Flat, because economy is worth the same at every distance: the
      // base card's own "halve it further out" branch was unreachable anyway, sitting
      // behind a `dist > N` test that an earlier `dist > 0` had already passed. The
      // "distance must be non-zero" guard is the base card's and is kept.
      return gwoCard.conditionalDeal(system.distance() > 0, 35);
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.structuresEcoStorage);
      inventory.addMods(
        _.flatten(
          _.map(
            gwoGroup.structuresEcoBasic.concat(gwoGroup.structuresEcoAdvanced),
            function (unit) {
              return gwoCard.mods(unit, "multiply", {
                "production.energy": 1.25,
                "production.metal": 1.25,
              });
            }
          )
        )
      );
    },
    dull: function () {},
  };
});
