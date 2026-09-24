define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_factories.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCardFactories, gwoGroup) {
  return gwoCardFactories.cooldownCard({
    name: "!LOC:Vehicle Cooldown Tech",
    description:
      "!LOC:Vehicle Cooldown Tech halves the cooldown time between builds for all vehicle factories.",
    icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png",
    audio: "/VO/Computer/gw/board_tech_available_vehicle",
    factories: gwoGroup.vehicleFactories,
  });
});
