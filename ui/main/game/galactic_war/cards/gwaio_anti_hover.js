define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: function () {
      if (gwoCard.isEnglish()) {
        return "!LOC:Anti-Hover Ammo Tech doubles all damage you deal to hover units — the Drifter, Ward, Kaiju and Ares — but halves damage to naval vessels.";
      }
      return "!LOC:Anti-Hover Ammo Tech doubles all damage you deal to hover units but halves damage to naval vessels.";
    },
    summarize: _.constant("!LOC:Anti-Hover Ammo Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.antiTechDeal(
        inventory,
        gwoCard.navalWeight(inventory, 40, 15),
        "gwaio_anti_sea"
      );
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.flatMapMods(gwoGroup.ammo, "multiplyOrCreate", {
          "armor_damage_map.AT_Hover": 2,
          "armor_damage_map.AT_Naval": 0.5,
        })
      );
    },
    dull: function () {},
  };
});
