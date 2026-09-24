define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_factories.js",
], function (gwoCardFactories) {
  return gwoCardFactories.antiTechCard({
    name: "!LOC:Anti-Tank Ammo Tech",
    description:
      "!LOC:Anti-Tank Ammo Tech doubles all damage you deal to vehicles but halves damage to bots.",
    icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle_armor.png",
    counter: "gwaio_anti_bots",
    armour: {
      AT_Vehicle: 2,
      AT_Bot: 0.5,
    },
  });
});
