define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_factories.js",
], function (gwoCardFactories) {
  return gwoCardFactories.antiTechCard({
    name: "!LOC:Anti-Commander Ammo Tech",
    description:
      "!LOC:Anti-Commander Ammo Tech doubles all damage you deal to commanders but halves damage to structures.",
    icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_armor.png",
    counter: "gwaio_anti_structure",
    armour: {
      AT_Commander: 2,
      AT_Structure: 0.5,
    },
  });
});
