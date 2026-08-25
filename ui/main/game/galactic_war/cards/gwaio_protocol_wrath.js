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

      var sightMods = gwoCard.flatMapMods(gwoGroup.combatMobile, "multiply", {
        "recon.observer.items.0.radius": percentageReduction,
        "recon.observer.items.1.radius": percentageReduction,
      });
      var speedMods = gwoCard.flatMapMods(
        gwoGroup.combatMobile,
        "multiply",
        gwoCard.eachPath(gwoCard.paths.navigation, percentageIncrease)
      );
      var rangeMods = gwoCard.flatMapMods(
        gwoGroup.combatMobileWeapons,
        "multiply",
        {
          max_range: percentageReduction,
        }
      );

      inventory.addMods(sightMods.concat(speedMods, rangeMods));
    },
    dull: function () {},
  };
});
