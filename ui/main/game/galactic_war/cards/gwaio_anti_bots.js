define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_factories.js",
], function (gwoCardFactories) {
  return gwoCardFactories.antiTechCard({
    name: "!LOC:Anti-Bot Ammo Tech",
    description:
      "!LOC:Anti-Bot Ammo Tech doubles all damage you deal to bots but halves damage to vehicles.",
    icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_combat.png",
    counter: "gwaio_anti_vehicles",
    armour: {
      AT_Vehicle: 0.5,
      AT_Bot: 2,
    },
  });
});
