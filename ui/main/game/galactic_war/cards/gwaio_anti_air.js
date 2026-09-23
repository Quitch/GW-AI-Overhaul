define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_factories.js",
], function (gwoCardFactories) {
  return gwoCardFactories.antiTechCard({
    name: "!LOC:Anti-Air Ammo Tech",
    description:
      "!LOC:Anti-Air Ammo Tech doubles all damage you deal to air units but halves damage to orbital units.",
    icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png",
    counter: "gwaio_anti_orbital",
    armour: {
      AT_Orbital: 0.5,
      AT_Air: 2,
    },
  });
});
