define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  return gwoCard.upgradeCard({
    name: "!LOC:Sub Commander Tactics Tech",
    describe: _.constant(
      "!LOC:Sub Commander Tactics Tech allows Sub Commanders to make smarter decisions when scouting, fighting, expanding, and escaping danger."
    ),
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_commander_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_subcommander",
    deal: function (system, context, inventory) {
      return { chance: gwoCard.subcommanderWeight(inventory, 55) };
    },
    // performed in shared/referee_subcommander_tech.js
    slot: false,
  });
});
