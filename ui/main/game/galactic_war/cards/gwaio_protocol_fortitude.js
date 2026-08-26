define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:All combat units gain +30% health and -15% movement speed."
    ),
    summarize: _.constant("!LOC:Protocol: Fortitude"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
    getContext: gwoCard.getContext,
    deal: function () {
      return { chance: 50 };
    },
    buff: function (inventory) {
      var percentageReduction = 0.85;
      var percentageIncrease = 1.3;

      var speedMods = gwoCard.flatMapMods(
        gwoGroup.combatMobile,
        "multiply",
        gwoCard.paths.navigation,
        percentageReduction
      );
      var healthMods = gwoCard.flatMapMods(gwoGroup.combat, "multiply", {
        max_health: percentageIncrease,
      });

      inventory.addMods(speedMods.concat(healthMods));
    },
    dull: function () {},
  };
});
