define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Improved Commander Build Arms increase build speed of all Commanders' build arms by 50% and reduces energy usage by 50%."
    ),
    summarize: _.constant("!LOC:Improved Commander Build Arm"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_metal.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_efficiency",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      // The base card ramped 50 -> 500, making this the single heaviest card in a
      // settled mid-game run. Its own "step back down further out" branch could
      // never fire: `if (dist > 5) 500; else if (dist > 9) 250;` - anything past 9
      // is already past 5. This buffs commander_build_arm, which every Sub
      // Commander carries, so it scales with the retinue like the other commander
      // cards rather than with distance; see gwoCard.commanderWeight.
      return { chance: gwoCard.commanderWeight(inventory, 50) };
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.commanderBuildArm, "multiply", {
          "construction_demand.energy": 0.5,
          "construction_demand.metal": 1.5,
        })
      );
    },
    dull: function () {},
  };
});
