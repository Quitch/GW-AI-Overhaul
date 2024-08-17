define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Anti-Bot Ammo Tech doubles all damage you deal to bots but halves damage to vehicles."
    ),
    summarize: _.constant("!LOC:Anti-Bot Ammo Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_combat.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 70;
      if (inventory.hasCard("gwaio_anti_vehicles")) {
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
              value: 0.5,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Bot",
              op: "multiplyOrAdd",
              value: 2.0,
            },
          ];
        })
      );
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
