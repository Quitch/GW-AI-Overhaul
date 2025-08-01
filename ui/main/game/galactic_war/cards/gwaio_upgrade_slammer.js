define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Slammer Upgrade Tech changes the advanced assault bot's torpedo into a rocket that targets surface units."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Slammer Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.slammer)) {
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
          file: gwoUnit.slammer,
          path: "tools.1.show_range",
          op: "replace",
          value: true,
        },
        {
          file: gwoUnit.slammerTorpedo,
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: gwoUnit.slammerTorpedo,
          path: "target_layers",
          op: "push",
          value: "WL_LandHorizontal",
        },
        {
          file: gwoUnit.slammerTorpedo,
          path: "target_priorities",
          op: "replace",
          value: ["Mobile", "Structure - Wall", "Wall"],
        },
        {
          file: gwoUnit.slammerTorpedoLandAmmo,
          path: "flight_layer",
          op: "replace",
          value: "Air",
        },
        {
          file: gwoUnit.slammerTorpedoLandAmmo,
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: gwoUnit.slammerTorpedoLandAmmo,
          path: "cruise_height",
          op: "replace",
          value: 200,
        },
      ]);
    },
    dull: function () {},
  };
});
