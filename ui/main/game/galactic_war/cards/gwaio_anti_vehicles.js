define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Anti-Tank Ammo Tech doubles all damage you deal to vehicles but halves damage to bots.",

  summarize: () => "!LOC:Anti-Tank Ammo Tech",

  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle_armor.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.antiTechDeal(inventory, 40, "gwaio_anti_bots");
  },

  buff: function (inventory) {
    inventory.addMods(
      _.flatten(
        _.map(gwoGroup.ammo, (ammo) =>
          gwoCard.mods(ammo, "multiplyOrCreate", {
            "armor_damage_map.AT_Vehicle": 2,
            "armor_damage_map.AT_Bot": 0.5,
          }),
        ),
      ),
    );
  },

  dull: function () {},
}));
