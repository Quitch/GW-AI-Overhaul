define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:All combat units gain +20% movement speed and -20% health."
    ),
    summarize: _.constant("!LOC:Protocol: Agility"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
    getContext: gwoCard.getContext,
    deal: function () {
      return { chance: 50 };
    },
    buff: function (inventory) {
      var percentageReduction = 0.8;
      var percentageIncrease = 1.2;

      var mobileMods = _.map(gwoGroup.combatMobile, function (unit) {
        return gwoCard.mods(unit, "multiply", {
          "navigation.move_speed": percentageIncrease,
          "navigation.brake": percentageIncrease,
          "navigation.acceleration": percentageIncrease,
          "navigation.turn_speed": percentageIncrease,
          max_health: percentageReduction,
        });
      });
      var healthMods = _.map(gwoGroup.combat, function (unit) {
        return gwoCard.mods(unit, "multiply", {
          max_health: percentageReduction,
        });
      });

      inventory.addMods(_.flatten(mobileMods.concat(healthMods)));
    },
    dull: function () {},
  };
});
