define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Commander Engine Tech increases the speed of your commanders by 100%."
    ),
    summarize: _.constant("!LOC:Commander Engine Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_speed" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return { chance: gwoCard.commanderWeight(inventory, 45) };
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.commander, "multiply", {
          "navigation.move_speed": 2,
          "navigation.brake": 2,
          "navigation.acceleration": 2,
          "navigation.turn_speed": 2,
        })
      );
    },
    dull: function () {},
  };
});
