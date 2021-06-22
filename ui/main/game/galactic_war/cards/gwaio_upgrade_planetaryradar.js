define({
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Planetary Upgrade Tech increases the vision of the planetary radar to match its radar."
    ),
    summarize: _.constant("!LOC:Planetary Radar Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_intelligence_fabrication.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_efficiency",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        inventory.hasCard(
          "gwaio_enable_planetaryradar"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 33.33,
        },
        {
          file: "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
          path: "recon.observer.items.2.radius",
          op: "multiply",
          value: 8.3325,
        },
      ]);
    },
    dull: function () {},
});
