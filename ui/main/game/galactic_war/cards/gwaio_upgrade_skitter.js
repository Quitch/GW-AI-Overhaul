define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Skitter Upgrade Tech increases the land scout's vision by 100%."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Skitter Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.skitter)) {
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
          file: gwoUnit.skitter,
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 2,
        },
        {
          file: gwoUnit.skitter,
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: 2,
        },
        {
          file: gwoUnit.skitter,
          path: "recon.observer.items.2.radius",
          op: "multiply",
          value: 2,
        },
      ]);
    },
    dull: function () {},
  };
});
