define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Anti-Tank Ammo Tech doubles all damage you deal to vehicles but halves damage to bots."
    ),
    summarize: _.constant("!LOC:Anti-Tank Ammo Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle_armor.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 70;
      if (inventory.hasCard("gwaio_anti_bots")) {
        chance = 0;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      const mods = _.flatten(
        _.map(gwoGroup.ammo, function (ammo) {
          return [
            {
              file: ammo,
              path: "armor_damage_map.AT_Vehicle",
              op: "multiplyOrAdd",
              value: 2.0,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Bot",
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
