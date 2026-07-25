define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Anti-Ship Ammo Tech doubles all damage you deal to naval vessels but halves damage to hover units."
    ),
    summarize: _.constant("!LOC:Anti-Ship Ammo Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      // Doubling damage against ships is only worth a data bank when there are
      // ships to shoot at. A naval loadout or Tsunami Tech floods every planet
      // fought on (referee_config.js's floodPlanets), which is what puts enemy
      // naval on the board; without one this stays in the deck for variety but at
      // a fraction of the weight. Owning ships yourself is deliberately not the
      // test - this modifies damage you deal, not damage you take.
      return gwoCard.antiTechDeal(
        inventory,
        gwoCard.navalWeight(inventory, 70, 15),
        "gwaio_anti_hover"
      );
    },
    buff: function (inventory) {
      inventory.addMods(
        _.flatten(
          _.map(gwoGroup.ammo, function (ammo) {
            return gwoCard.mods(ammo, "multiplyOrCreate", {
              "armor_damage_map.AT_Hover": 0.5,
              "armor_damage_map.AT_Naval": 2,
            });
          })
        )
      );
    },
    dull: function () {},
  };
});
