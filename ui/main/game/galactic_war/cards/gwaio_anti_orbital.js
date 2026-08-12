define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Anti-Orbital Ammo Tech doubles all damage you deal to orbital units but halves damage to air units.",

  summarize: () => "!LOC:Anti-Orbital Ammo Tech",

  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.antiTechDeal(inventory, 40, "gwaio_anti_air");
  },

  buff: function (inventory) {
    inventory.addMods(
      _.flatten(
        _.map(gwoGroup.ammo, (ammo) =>
          gwoCard.mods(ammo, "multiplyOrCreate", {
            "armor_damage_map.AT_Orbital": 2,
            "armor_damage_map.AT_Air": 0.5,
          }),
        ),
      ),
    );
  },

  dull: function () {},
}));
