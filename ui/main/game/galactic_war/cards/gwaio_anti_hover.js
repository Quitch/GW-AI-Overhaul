define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Anti-Hover Ammo Tech doubles all damage you deal to hover units but halves damage to naval."
    ),
    summarize: _.constant("!LOC:Anti-Hover Ammo Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function () {
      return { chance: 70 };
    },
    buff: function (inventory) {
      const mods = _.flatten(
        _.map(gwoGroup.ammo, function (ammo) {
          return [
            {
              file: ammo,
              path: "armor_damage_map.AT_Hover",
              op: "multiplyOrAdd",
              value: 2.0,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Naval",
              op: "multiplyOrAdd",
              value: 0.5,
            },
          ];
        })
      );
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
