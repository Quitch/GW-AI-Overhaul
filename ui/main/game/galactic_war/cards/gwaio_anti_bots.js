define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Anti-Bot Ammo Tech doubles all damage you deal to bots but halves damage to vehicles.",

  summarize: () => "!LOC:Anti-Bot Ammo Tech",

  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_combat.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.antiTechDeal(inventory, 40, "gwaio_anti_vehicles");
  },

  buff: function (inventory) {
    inventory.addMods(
      _.flatten(
        _.map(gwoGroup.ammo, (ammo) =>
          gwoCard.mods(ammo, "multiplyOrCreate", {
            "armor_damage_map.AT_Vehicle": 0.5,
            "armor_damage_map.AT_Bot": 2,
          }),
        ),
      ),
    );
  },

  dull: function () {},
}));
