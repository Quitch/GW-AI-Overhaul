define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Metal and energy storage on all commanders and storage structures increased by 300%. Adds in blueprints for storage structures."
    ),
    summarize: _.constant("!LOC:Storage Compression Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_storage_compression.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_economy",
    }),
    getContext: gwoCard.getContext,
    deal: function () {
      // Flat, for the same reason as gwc_storage_and_buff: storage capacity is worth
      // the same at every distance. The earlier 130/70 cut from the base card's
      // 500/250 kept its shape, which ran backwards, and still averaged ~112 - above
      // every other card of its weight class for a niche eco tech.
      return { chance: 45 };
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.structuresEcoStorage);
      var units = gwoGroup.structuresEcoStorage.concat(gwoUnit.commander);
      inventory.addMods(
        _.flatten(
          _.map(units, function (unit) {
            return [
              {
                file: unit,
                path: "storage.energy",
                op: "multiply",
                value: 4,
              },
              {
                file: unit,
                path: "storage.metal",
                op: "multiply",
                value: 4,
              },
            ];
          })
        )
      );
    },
    dull: function () {},
  };
});
