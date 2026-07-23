define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Basic Bot tech enables building of basic Bots and basic Bot Factories. Basic Bot factories are built via your commander or any basic fabricator."
    ),
    summarize: _.constant("!LOC:Basic Bot Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_combat.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_bot" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.missingUnit(inventory.units(), gwoGroup.botsBasic)) {
        chance = gwoCard.travelledFar(
          system,
          context,
          GW.balance.numberOfSystems
        )
          ? 100
          : 250;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.botsBasic);
    },
    dull: function () {},
  };
});
