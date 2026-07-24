define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Combat Tech increases speed of all orbital units by 50%, health by 50%, and damage by 25%"
    ),
    summarize: _.constant("!LOC:Orbital Combat Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png"
    ),
    audio: _.constant({
      found: "PA/VO/Computer/gw/board_tech_available_combat",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      var chance = 28;

      if (gwoCard.travelledFar(system, context, GW.balance.numberOfSystems)) {
        chance = 142;
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
            return [
              {
                file: unit,
                path: path,
                op: "multiply",
                value: 1.5,
              },
            ];
          });
        })
      );

      _.forEach(gwoGroup.orbital, function (unit) {
        mods.push({
          file: unit,
          path: "max_health",
          op: "multiply",
          value: 1.5,
        });
      });

      _.forEach(gwoGroup.orbitalAmmo, function (ammo) {
        mods.push({
          file: ammo,
          path: "damage",
          op: "multiply",
          value: 1.25,
        });
      });

      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
