define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:All combat units gain +15% sight and weapon range and -15% movement speed.",

  summarize: () => "!LOC:Protocol: Precision",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
  getContext: gwoCard.getContext,

  deal: function () {
    return { chance: 50 };
  },

  buff: function (inventory) {
    const percentageReduction = 0.85;
    const percentageIncrease = 1.15;

    const speedMods = gwoCard.flatMapMods(
      gwoGroup.combatMobile,
      "multiply",
      gwoCard.paths.navigation,
      percentageReduction,
    );
    const sightMods = gwoCard.flatMapMods(
      gwoGroup.combatMobile,
      "multiply",
      gwoCard.observerPaths(2, "radius"),
      percentageIncrease,
    );
    const rangeMods = gwoCard.flatMapMods(
      gwoGroup.combatMobileWeapons,
      "multiply",
      {
        max_range: percentageIncrease,
      },
    );
    // Try to make sure that units can use their full range
    const ammoMods = gwoCard.flatMapMods(
      gwoGroup.combatMobileAmmo,
      "multiply",
      {
        lifetime: percentageIncrease,
        max_velocity: percentageIncrease,
      },
    );

    inventory.addMods(speedMods.concat(sightMods, rangeMods, ammoMods));
  },

  dull: function () {},
}));
