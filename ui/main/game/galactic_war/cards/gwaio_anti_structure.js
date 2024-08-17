define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Anti-Structure Ammo Tech doubles all damage you deal to structures but halves damage to mobile units."
    ),
    summarize: _.constant("!LOC:Anti-Structure Ammo Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_structure.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function () {
      var chance = 70;
      const hasAntiTech = _.some(
        model.game().inventory().cards(),
        function (card) {
          return _.startsWith(card.id, "gwaio_anti_");
        }
      );
      if (hasAntiTech) {
        chance = 35;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      const mods = _.flatten(
        _.map(gwoGroup.ammo, function (ammo) {
          return [
            {
              file: ammo,
              path: "armor_damage_map.AT_Structure",
              op: "multiplyOrAdd",
              value: 2.0,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Air",
              op: "multiplyOrAdd",
              value: 0.5,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Bot",
              op: "multiplyOrAdd",
              value: 0.5,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Hover",
              op: "multiplyOrAdd",
              value: 0.5,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Orbital",
              op: "multiplyOrAdd",
              value: 0.5,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Naval",
              op: "multiplyOrAdd",
              value: 0.5,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Vehicle",
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
