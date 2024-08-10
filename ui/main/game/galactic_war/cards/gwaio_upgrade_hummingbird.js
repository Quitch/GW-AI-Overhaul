define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Hummingbird Upgrade Tech adds the ability for fighters to move between planets."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Hummingbird Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_air_engine_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_speed",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.hummingbird)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.hummingbird,
          path: "system_velocity_multiplier",
          op: "replace",
          value: 30,
        },
        {
          file: gwoUnit.hummingbird,
          path: "gravwell_velocity_multiplier",
          op: "replace",
          value: 10,
        },
        {
          file: gwoUnit.hummingbird,
          path: "navigation.inter_planetary_type",
          op: "replace",
          value: "system",
        },
        {
          file: gwoUnit.hummingbird,
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_Interplanetary",
        },
      ]);
    },
    dull: function () {},
  };
});
