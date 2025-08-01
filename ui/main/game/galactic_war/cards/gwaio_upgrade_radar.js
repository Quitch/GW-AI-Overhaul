define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Radar Upgrade Tech increases the vision and radar radius of basic radar by 50%."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Radar Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_intelligence_fabrication_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_efficiency",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.radar)) {
        chance = 60;
      }
      return {
        params: {
          allowOverflow: true,
        },
        chance: chance,
      };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.radar,
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: gwoUnit.radar,
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: gwoUnit.radar,
          path: "recon.observer.items.2.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: gwoUnit.radar,
          path: "recon.observer.items.3.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: gwoUnit.radar,
          path: "recon.observer.items.4.radius",
          op: "multiply",
          value: 1.5,
        },
      ]);
    },
    dull: function () {},
  };
});
