define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_factories.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCardFactories, gwoGroup) {
  return gwoCardFactories.cooldownCard({
    name: "!LOC:Bot Cooldown Tech",
    description:
      "!LOC:Bot Cooldown Tech halves the cooldown time between builds for all bot factories.",
    icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_factory.png",
    audio: "/VO/Computer/gw/board_tech_available_bot",
    factories: gwoGroup.botFactories,
  });
});
