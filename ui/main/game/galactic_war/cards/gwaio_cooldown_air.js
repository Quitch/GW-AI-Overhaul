define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_factories.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCardFactories, gwoGroup) {
  return gwoCardFactories.cooldownCard({
    name: "!LOC:Air Cooldown Tech",
    description:
      "!LOC:Air Cooldown Tech halves the cooldown time between builds for all air factories.",
    icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png",
    audio: "/VO/Computer/gw/board_tech_available_air",
    factories: gwoGroup.airFactories,
  });
});
