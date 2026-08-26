define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Efficiency Tech increases metal and energy production by 25%. Tech also grants metal and energy storage."
    ),
    summarize: _.constant("!LOC:Efficiency Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_storage_compression.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_economy",
    }),
    getContext: gwoCard.getContext,
    deal: function () {
      return { chance: 35 };
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.structuresEcoStorage);
      inventory.addMods(
        gwoCard.flatMapMods(
          gwoGroup.structuresEcoBasic.concat(gwoGroup.structuresEcoAdvanced),
          "multiply",
          {
            "production.energy": 1.25,
            "production.metal": 1.25,
          }
        )
      );
    },
    dull: function () {},
  };
});
