define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Air Armor Tech increases the health of all air units by 50%"
    ),
    summarize: _.constant("!LOC:Air Armor Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_armor",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoGroup.airMobileNoCluster)) {
        chance = 70;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = _.map(gwoGroup.airMobile, function (unit) {
        return {
          file: unit,
          path: "max_health",
          op: "multiply",
          value: 1.5,
        };
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
