define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Slammer Upgrade Tech changes the advanced assault bot's torpedo into a rocket that targets surface units."
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
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwaioCards.hasUnit(inventory.units(), gwaioUnits.slammer)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.slammer,
          path: "tools.1.show_range",
          op: "replace",
          value: true,
        },
        {
          file: gwaioUnits.slammerTorpedo,
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: gwaioUnits.slammerTorpedo,
          path: "target_layers",
          op: "replace",
          value: ["WL_LandHorizontal", "WL_WaterSurface"],
        },
        {
          file: gwaioUnits.slammerTorpedo,
          path: "target_priorities",
          op: "replace",
          value: ["Mobile", "Structure - Wall", "Wall"],
        },
        {
          file: gwaioUnits.slammerTorpedoAmmo,
          path: "flight_layer",
          op: "replace",
          value: "Air",
        },
        {
          file: gwaioUnits.slammerTorpedoAmmo,
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: gwaioUnits.slammerTorpedoAmmo,
          path: "cruise_height",
          op: "replace",
          value: 200,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
