define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:All combat units gain +30% health and -15% movement speed.",

  summarize: () => "!LOC:Protocol: Fortitude",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
  getContext: gwoCard.getContext,

  deal: function () {
    return { chance: 50 };
  },

  buff: function (inventory) {
    const percentageReduction = 0.85;
    const percentageIncrease = 1.3;

    const speedMods = _.map(gwoGroup.combatMobile, (unit) =>
      gwoCard.mods(unit, "multiply", {
        "navigation.move_speed": percentageReduction,
        "navigation.brake": percentageReduction,
        "navigation.acceleration": percentageReduction,
        "navigation.turn_speed": percentageReduction,
      }),
    );
    const healthMods = _.map(gwoGroup.combat, (unit) =>
      gwoCard.mods(unit, "multiply", {
        max_health: percentageIncrease,
      }),
    );

    inventory.addMods(_.flatten(speedMods.concat(healthMods)));
  },

  dull: function () {},
}));
