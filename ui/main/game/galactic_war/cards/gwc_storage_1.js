define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoUnit, gwoGroup) {
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
    deal: function (system, context) {
      // Base weight cut (was 250/125): storage is a low-priority eco card that was
      // over-appearing, especially early. Threshold re-centred on star distance.
      var chance = 130;
      if (
        gwoCard.travelledModerate(system, context, GW.balance.numberOfSystems)
      ) {
        chance = 70;
      }
      return { chance: chance };
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
