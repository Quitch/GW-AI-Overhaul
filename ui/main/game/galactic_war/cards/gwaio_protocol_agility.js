define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:All combat units gain +20% movement speed and -20% health.",

  summarize: () => "!LOC:Protocol: Agility",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
  getContext: gwoCard.getContext,

  deal: function () {
    return { chance: 50 };
  },

  buff: function (inventory) {
    const percentageReduction = 0.8;
    const percentageIncrease = 1.2;

    const mobileMods = _.map(gwoGroup.combatMobile, (unit) =>
      gwoCard.mods(unit, "multiply", {
        "navigation.move_speed": percentageIncrease,
        "navigation.brake": percentageIncrease,
        "navigation.acceleration": percentageIncrease,
        "navigation.turn_speed": percentageIncrease,
      })
    );
    const healthMods = _.map(gwoGroup.combat, (unit) =>
      gwoCard.mods(unit, "multiply", {
        max_health: percentageReduction,
      })
    );

    inventory.addMods(_.flatten(mobileMods.concat(healthMods)));
  },

  dull: function () {},
}));
