define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Engine Tech increases speed of all orbital units by 50%"
    ),
    summarize: _.constant("!LOC:Orbital Engine Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_speed",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      var dist = system.distance();
      var chance = context.totalSize <= GW.balance.numberOfSystems[1] ? 16 : 32;

      if (
        (context.totalSize <= GW.balance.numberOfSystems[2] && dist > 6) ||
        (context.totalSize <= GW.balance.numberOfSystems[3] && dist > 9) ||
        (context.totalSize > GW.balance.numberOfSystems[3] && dist > 12)
      ) {
        chance = 166;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var paths = [
        "navigation.move_speed",
        "navigation.brake",
        "navigation.acceleration",
        "navigation.turn_speed",
      ];
      var mods = _.flatten(
        _.map(gwoGroup.orbitalMobile, function (unit) {
          return _.map(paths, function (path) {
            return {
              file: unit,
              path: path,
              op: "multiply",
              value: 1.5,
            };
          });
        })
      );

      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
