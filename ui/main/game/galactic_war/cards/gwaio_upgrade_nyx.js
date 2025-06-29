define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Nyx Upgrade Tech doubles the jamming and radar radius of the jamming vehicle."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Nyx Upgrade Tech"),
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
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.nyx)) {
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
          file: gwoUnit.nyx,
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: 2,
        },
        {
          file: gwoUnit.nyx,
          path: "recon.observer.items.3.radius",
          op: "multiply",
          value: 2,
        },
      ]);
    },
    dull: function () {},
  };
});
