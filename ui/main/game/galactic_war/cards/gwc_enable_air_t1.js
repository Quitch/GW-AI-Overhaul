define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Basic air tech enables building of mobile air units and factories. Basic air factories are built via your commander or any basic fabricator."
    ),
    summarize: _.constant("!LOC:Basic Air Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_air" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.missingUnit(inventory.units(), gwoGroup.airBasic)) {
        chance = gwoCard.travelledFar(
          system,
          context,
          GW.balance.numberOfSystems
        )
          ? 50
          : 200;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.airBasic);
    },
    dull: function () {},
  };
});
