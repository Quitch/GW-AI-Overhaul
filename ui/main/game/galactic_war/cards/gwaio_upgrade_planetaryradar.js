define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: function () {
      if (gwoCard.isEnglish()) {
        return gwoCard.withSlot(
          loc(
            "!LOC:Planetary Radar Upgrade Tech increases the vision of the planetary radar to match its radar."
          )
        );
      }
      return gwoCard.withSlot(
        loc(
          "!LOC:Planetary Upgrade Tech increases the vision of the planetary radar to match its radar."
        )
      );
    },
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
      inventory.addMods(
        gwoCard.mods(gwoUnit.deepSpaceOrbitalRadar, "multiply", {
          "recon.observer.items.0.radius": 33.33,
          "recon.observer.items.1.radius": 33.33,
          "recon.observer.items.2.radius": 8.3325,
        })
      );
    },
    dull: function () {},
  };
});
