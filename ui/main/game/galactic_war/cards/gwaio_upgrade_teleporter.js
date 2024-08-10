define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Teleporter Upgrade Tech removes all energy consumption and efficiency requirements from the interplanetary teleporter and makes it invisible to radar."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Teleporter Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_energy_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_efficiency",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.teleporter)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.teleporter,
          path: "energy_efficiency_requirement",
          op: "replace",
          value: 0,
        },
        {
          file: gwoUnit.teleporter,
          path: "teleporter.energy_demand",
          op: "replace",
          value: 0,
        },
        {
          file: gwoUnit.teleporter,
          path: "recon.observable.ignore_radar",
          op: "replace",
          value: true,
        },
      ]);
    },
    dull: function () {},
  };
});
