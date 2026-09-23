define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_factories.js",
], function (gwoCardFactories) {
  return gwoCardFactories.antiTechCard({
    name: "!LOC:Anti-Orbital Ammo Tech",
    description:
      "!LOC:Anti-Orbital Ammo Tech doubles all damage you deal to orbital units but halves damage to air units.",
    icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png",
    counter: "gwaio_anti_air",
    armour: {
      AT_Orbital: 2,
      AT_Air: 0.5,
    },
  });
});
