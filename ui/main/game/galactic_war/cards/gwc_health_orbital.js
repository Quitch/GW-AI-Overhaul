define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Armor Tech increases health of all orbital units by 50%"
    ),
    summarize: _.constant("!LOC:Orbital Armor Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_armor" }),
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      // gw_galaxy.js sizes each system by its star distance, so travelling deeper
      // means more planets per fight and more use for orbital. Small and Medium
      // galaxies never get deep enough for that to pay off. The old first test also
      // checked numberOfSystems[0], which numberOfSystems[1] already covers.
      var sizes = GW.balance.numberOfSystems;
      if (context.totalSize <= sizes[1]) {
        return { chance: 16 };
      }
      return {
        chance: gwoCard.travelledModerate(system, context, sizes) ? 160 : 32,
      };
    },
    buff: function (inventory) {
      var mods = _.map(gwoGroup.orbitalMobile, function (unit) {
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
