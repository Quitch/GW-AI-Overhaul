define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Planetary Upgrade Tech increases the vision of the planetary radar to match its radar."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Planetary Radar Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_intelligence_fabrication_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_efficiency",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        inventory.hasCard("gwaio_enable_planetaryradar")
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.deepSpaceOrbitalRadar,
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 33.33,
        },
        {
          file: gwoUnit.deepSpaceOrbitalRadar,
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: 33.33,
        },
        {
          file: gwoUnit.deepSpaceOrbitalRadar,
          path: "recon.observer.items.2.radius",
          op: "multiply",
          value: 8.3325,
        },
      ]);
    },
    dull: function () {},
  };
});
