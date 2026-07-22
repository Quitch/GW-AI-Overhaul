define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Anti-Structure Ammo Tech doubles all damage you deal to structures but halves damage to mobile units excluding commanders."
    ),
    summarize: _.constant("!LOC:Anti-Structure Ammo Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_structure.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 70;
      var hasAntiTech = _.some(
        model.game().inventory().cards(),
        function (card) {
          return _.startsWith(card.id, "gwaio_anti_");
        }
      );
      if (inventory.hasCard("gwaio_anti_commander")) {
        chance = 0;
      } else if (hasAntiTech) {
        chance /= 2;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = _.flatten(
        _.map(gwoGroup.ammo, function (ammo) {
          return [
            {
              file: ammo,
              path: "armor_damage_map.AT_Structure",
              op: "multiplyOrCreate",
              value: 2,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Air",
              op: "multiplyOrCreate",
              value: 0.5,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Bot",
              op: "multiplyOrCreate",
              value: 0.5,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Hover",
              op: "multiplyOrCreate",
              value: 0.5,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Orbital",
              op: "multiplyOrCreate",
              value: 0.5,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Naval",
              op: "multiplyOrCreate",
              value: 0.5,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Vehicle",
              op: "multiplyOrCreate",
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
