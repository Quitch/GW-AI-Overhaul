define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Anti-Air Ammo Tech doubles all damage you deal to air units but halves damage to orbital units."
    ),
    summarize: _.constant("!LOC:Anti-Air Ammo Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 70;
      const hasAntiTech = _.some(
        model.game().inventory().cards(),
        function (card) {
          return _.startsWith(card.id, "gwaio_anti_");
        }
      );
      if (inventory.hasCard("gwaio_anti_orbital")) {
        chance = 0;
      } else if (hasAntiTech) {
        chance /= 2;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      const mods = _.flatten(
        _.map(gwoGroup.ammo, function (ammo) {
          return [
            {
              file: ammo,
              path: "armor_damage_map.AT_Orbital",
              op: "multiplyOrAdd",
              value: 0.5,
            },
            {
              file: ammo,
              path: "armor_damage_map.AT_Air",
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
