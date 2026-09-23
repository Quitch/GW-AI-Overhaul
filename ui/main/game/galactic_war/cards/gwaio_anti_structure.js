define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_factories.js",
], function (gwoCardFactories) {
  return gwoCardFactories.antiTechCard({
    name: "!LOC:Anti-Structure Ammo Tech",
    description:
      "!LOC:Anti-Structure Ammo Tech doubles all damage you deal to structures but halves damage to mobile units excluding commanders.",
    icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_structure.png",
    counter: "gwaio_anti_commander",
    armour: {
      AT_Structure: 2,
      AT_Air: 0.5,
      AT_Bot: 0.5,
      AT_Hover: 0.5,
      AT_Orbital: 0.5,
      AT_Naval: 0.5,
      AT_Vehicle: 0.5,
    },
  });
});
