define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:All combat units gain +20% movement speed and -10% sight and weapon range."
    ),
    summarize: _.constant("!LOC:Protocol: Wrath"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
    getContext: gwoCard.getContext,
    deal: function () {
      return { chance: 50 };
    },
    buff: function (inventory) {
      var percentageReduction = 0.9;
      var percentageIncrease = 1.2;

      var sightMods = _.map(gwoGroup.combat, function (unit) {
        return gwoCard.mods(unit, "multiply", {
          "recon.observer.items.0.radius": percentageReduction,
          "recon.observer.items.1.radius": percentageReduction,
        });
      });
      var speedMods = _.map(gwoGroup.combatMobile, function (unit) {
        return gwoCard.mods(unit, "multiply", {
          "navigation.move_speed": percentageIncrease,
          "navigation.brake": percentageIncrease,
          "navigation.acceleration": percentageIncrease,
          "navigation.turn_speed": percentageIncrease,
        });
      });
      var rangeMods = _.map(gwoGroup.weapons, function (weapon) {
        return gwoCard.mods(weapon, "multiply", {
          max_range: percentageReduction,
        });
      });

      inventory.addMods(_.flatten(sightMods.concat(speedMods, rangeMods)));
    },
    dull: function () {},
  };
});
