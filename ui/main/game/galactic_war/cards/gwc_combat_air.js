define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwaioCards, gwaioGroups) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Air Combat Tech increases the speed of all air units by 25%, health by 50%, and damage by 25%"
    ),
    summarize: _.constant("!LOC:Air Combat Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
    ),
    audio: function () {
      return {
        found: "PA/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwaioCards.hasUnit(inventory.units(), gwaioGroups.airMobile)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [];
      _.forEach(gwaioGroups.airMobile, function (unit) {
        mods.push(
          {
            file: unit,
            path: "navigation.move_speed",
            op: "multiply",
            value: 1.25,
          },
          {
            file: unit,
            path: "navigation.brake",
            op: "multiply",
            value: 1.25,
          },
          {
            file: unit,
            path: "navigation.acceleration",
            op: "multiply",
            value: 1.25,
          },
          {
            file: unit,
            path: "navigation.turn_speed",
            op: "multiply",
            value: 1.25,
          },
          {
            file: unit,
            path: "max_health",
            op: "multiply",
            value: 1.5,
          }
        );
      });
      _.forEach(gwaioGroups.airAmmo, function (ammo) {
        mods.push({
          file: ammo,
          path: "damage",
          op: "multiply",
          value: 1.25,
        });
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
