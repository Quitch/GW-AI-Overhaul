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
      return gwoCard.antiTechDeal(inventory, 70, "gwaio_anti_commander");
    },
    buff: function (inventory) {
      inventory.addMods(
        _.flatten(
          _.map(gwoGroup.ammo, function (ammo) {
            return gwoCard.mods(ammo, "multiplyOrCreate", {
              "armor_damage_map.AT_Structure": 2,
              "armor_damage_map.AT_Air": 0.5,
              "armor_damage_map.AT_Bot": 0.5,
              "armor_damage_map.AT_Hover": 0.5,
              "armor_damage_map.AT_Orbital": 0.5,
              "armor_damage_map.AT_Naval": 0.5,
              "armor_damage_map.AT_Vehicle": 0.5,
            });
          })
        )
      );
    },
    dull: function () {},
  };
});
