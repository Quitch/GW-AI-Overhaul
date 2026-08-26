define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: function () {
      if (gwoCard.isEnglish()) {
        return "!LOC:Anti-Ship Ammo Tech doubles all damage you deal to naval vessels but halves damage to hover units. The Kaiju is armoured as a hover unit.";
      }
      return "!LOC:Anti-Ship Ammo Tech doubles all damage you deal to naval vessels but halves damage to hover units.";
    },
    summarize: _.constant("!LOC:Anti-Ship Ammo Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.antiTechDeal(
        inventory,
        gwoCard.navalWeight(inventory, 40, 15),
        "gwaio_anti_hover"
      );
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.flatMapMods(gwoGroup.ammo, "multiplyOrCreate", {
          "armor_damage_map.AT_Hover": 0.5,
          "armor_damage_map.AT_Naval": 2,
        })
      );
    },
    dull: function () {},
  };
});
