define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Zeus Upgrade Tech adds the ability for the lightning titan to move between planets."
    ),
    summarize: _.constant("!LOC:Zeus Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_enable_titans_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_speed",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function () {
      var chance = 0;
      if (gwaioCards.hasUnit(gwaioUnits.zeus)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.zeus,
          path: "system_velocity_multiplier",
          op: "replace",
          value: 15,
        },
        {
          file: gwaioUnits.zeus,
          path: "gravwell_velocity_multiplier",
          op: "replace",
          value: 6,
        },
        {
          file: gwaioUnits.zeus,
          path: "navigation.inter_planetary_type",
          op: "replace",
          value: "system",
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
