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
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_economy",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      var chance = 250;
      const dist = system.distance();
      if (
        (context.totalSize <= GW.balance.numberOfSystems[0] && dist > 4) ||
        (context.totalSize <= GW.balance.numberOfSystems[1] && dist > 6) ||
        (context.totalSize <= GW.balance.numberOfSystems[2] && dist > 9) ||
        (context.totalSize <= GW.balance.numberOfSystems[3] && dist > 10) ||
        dist > 12
      ) {
        chance = 125;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.structuresEcoStorage);
      const units = gwoGroup.structuresEcoStorage.concat(gwoUnit.commander);
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
