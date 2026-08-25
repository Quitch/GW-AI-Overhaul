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

      var speedMods = gwoCard.flatMapMods(
        gwoGroup.combatMobile,
        "multiply",
        gwoCard.eachPath(gwoCard.paths.navigation, percentageReduction)
      );
      var sightMods = gwoCard.flatMapMods(gwoGroup.combatMobile, "multiply", {
        "recon.observer.items.0.radius": percentageIncrease,
        "recon.observer.items.1.radius": percentageIncrease,
      });
      var rangeMods = gwoCard.flatMapMods(
        gwoGroup.combatMobileWeapons,
        "multiply",
        {
          max_range: percentageIncrease,
        }
      );
      // Try to make sure that units can use their full range
      var ammoMods = gwoCard.flatMapMods(
        gwoGroup.combatMobileAmmo,
        "multiply",
        {
          lifetime: percentageIncrease,
          max_velocity: percentageIncrease,
        }
      );

      inventory.addMods(speedMods.concat(sightMods, rangeMods, ammoMods));
    },
    dull: function () {},
  };
});
