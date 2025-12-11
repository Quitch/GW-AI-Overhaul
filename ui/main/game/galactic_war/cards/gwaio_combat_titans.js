define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Titan Combat Tech increases the speed of all titans by 20%, health by 50%, and damage by 25%"
    ),
    summarize: _.constant("!LOC:Titan Combat Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_enable_titans.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_armor",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoGroup.titans)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      const mods = _.map(gwoGroup.titans, function (unit) {
        return {
          file: unit,
          path: "max_health",
          op: "multiply",
          value: 1.5,
        };
      });
      _.forEach(gwoGroup.titansMobile, function (unit) {
        mods.push(
          {
            file: unit,
            path: "navigation.move_speed",
            op: "multiply",
            value: 1.2,
          },
          {
            file: unit,
            path: "navigation.brake",
            op: "multiply",
            value: 1.2,
          },
          {
            file: unit,
            path: "navigation.acceleration",
            op: "multiply",
            value: 1.2,
          },
          {
            file: unit,
            path: "navigation.turn_speed",
            op: "multiply",
            value: 1.2,
          }
        );
      });
      _.forEach(gwoGroup.titansAmmo, function (ammo) {
        mods.push(
          {
            file: ammo,
            path: "damage",
            op: "multiply",
            value: 1.25,
          },
          {
            file: ammo,
            path: "splash_damage",
            op: "multiply",
            value: 1.25,
          }
        );
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
