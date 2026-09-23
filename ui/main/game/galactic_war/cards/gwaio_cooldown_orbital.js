define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_factories.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
], function (gwoCardFactories, gwoGroup, gwoUnit, GW, gwoCard) {
  return gwoCardFactories.cooldownCard({
    name: "!LOC:Orbital Cooldown Tech",
    description:
      "!LOC:Orbital Cooldown Tech halves the cooldown time between builds for all orbital factories.",
    icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png",
    audio: "/VO/Computer/gw/board_tech_available_orbital",
    factories: gwoGroup.orbitalFactories,
    // The Orbital Launcher has no factory_cooldown_time
    requires: gwoUnit.orbitalFactory,
    chance: function (inventory, system, context) {
      var sizes = GW.balance.numberOfSystems;
      return gwoCard.travelledShort(system, context, sizes) ? 70 : 35;
    },
  });
});
