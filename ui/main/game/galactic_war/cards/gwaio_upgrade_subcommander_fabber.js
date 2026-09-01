define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
], function (gwoCard, gwoAI) {
  return gwoCard.upgradeCard({
    name: "!LOC:Sub Commander Fabber Tech",
    describe: _.constant(
      "!LOC:Sub Commander Fabber Tech increases the number of fabbers each Sub Commander may use by 50%."
    ),
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_commander_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_subcommander",
    deal: function (system, context, inventory) {
      // Sub Commanders fight as the player's race, so Queller withholds this
      // card only when that race's ally brain is Queller. See races.md.
      if (
        gwoAI.aiInUse("subcommander", gwoAI.raceOf(inventory)) === "Queller"
      ) {
        return { chance: 0 };
      }
      return { chance: gwoCard.subcommanderWeight(inventory, 55) };
    },
    // performed in shared/referee_subcommander_tech.js
    slot: false,
  });
});
