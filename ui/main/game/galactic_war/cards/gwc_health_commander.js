define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Commander Armor Tech increases the health of your commanders by 100%."
    ),
    summarize: _.constant("!LOC:Commander Armor Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_armor" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      // Scales with Sub Commanders rather than distance; see
      // gwoCard.commanderWeight.
      return { chance: gwoCard.commanderWeight(inventory, 70) };
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.commander, "multiply", { max_health: 2 })
      );
    },
    dull: function () {},
  };
});
