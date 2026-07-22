define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:All combat units gain +15% sight and weapon range and -15% movement speed."
    ),
    summarize: _.constant("!LOC:Protocol: Precision"),
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
      var percentageIncrease = 1.15;

      var speedMods = _.map(gwoGroup.combatMobile, function (unit) {
        return gwoCard.mods(unit, "multiply", {
          "navigation.move_speed": percentageReduction,
          "navigation.brake": percentageReduction,
          "navigation.acceleration": percentageReduction,
          "navigation.turn_speed": percentageReduction,
        });
      });
      var sightMods = _.map(gwoGroup.combat, function (unit) {
        return gwoCard.mods(unit, "multiply", {
          "recon.observer.items.0.radius": percentageIncrease,
          "recon.observer.items.1.radius": percentageIncrease,
        });
      });
      var rangeMods = _.map(gwoGroup.weapons, function (weapon) {
        return gwoCard.mods(weapon, "multiply", {
          max_range: percentageIncrease,
        });
      });
      // Try to make sure that units can use their full range
      var ammoMods = _.map(gwoGroup.ammo, function (ammo) {
        return gwoCard.mods(ammo, "multiply", {
          lifetime: percentageIncrease,
          max_velocity: percentageIncrease,
        });
      });

      inventory.addMods(
        _.flatten(speedMods.concat(sightMods, rangeMods, ammoMods))
      );
    },
    dull: function () {},
  };
});
