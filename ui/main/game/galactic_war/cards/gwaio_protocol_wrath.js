define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:All combat units gain +20% movement speed and -10% sight and weapon range.",

  summarize: () => "!LOC:Protocol: Wrath",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
  getContext: gwoCard.getContext,

  deal: function () {
    return { chance: 50 };
  },

  buff: function (inventory) {
    const percentageReduction = 0.9;
    const percentageIncrease = 1.2;

    const sightMods = gwoCard.flatMapMods(
      gwoGroup.combatMobile,
      "multiply",
      gwoCard.observerPaths(2, "radius"),
      percentageReduction,
    );
    const speedMods = gwoCard.flatMapMods(
      gwoGroup.combatMobile,
      "multiply",
      gwoCard.paths.navigation,
      percentageIncrease,
    );
    const rangeMods = gwoCard.flatMapMods(
      gwoGroup.combatMobileWeapons,
      "multiply",
      {
        max_range: percentageReduction,
      },
    );

    inventory.addMods(sightMods.concat(speedMods, rangeMods));
  },

  dull: function () {},
}));
