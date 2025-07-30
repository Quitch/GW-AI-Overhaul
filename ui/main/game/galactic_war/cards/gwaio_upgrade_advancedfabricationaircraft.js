define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Advanced Fabrication Aircraft Upgrade Tech adds the ability for the advanced fabricator to move between planets."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Advanced Fabrication Aircraft Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_air",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.airFactoryAdvanced)) {
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
          file: gwoUnit.airFabberAdvanced,
          path: "system_velocity_multiplier",
          op: "replace",
          value: 30,
        },
        {
          file: gwoUnit.airFabberAdvanced,
          path: "gravwell_velocity_multiplier",
          op: "replace",
          value: 10,
        },
        {
          file: gwoUnit.airFabberAdvanced,
          path: "navigation.inter_planetary_type",
          op: "replace",
          value: "system",
        },
        {
          file: gwoUnit.airFabberAdvanced,
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_Interplanetary",
        },
      ]);
    },
    dull: function () {},
  };
});
