define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Complete Orbital Tech enables building of all orbital units and all orbital Factories. Orbital launchers are built by any basic fabricator. Orbital factories are built via an orbital fabricator."
    ),
    summarize: _.constant("!LOC:Complete Orbital Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_orbital",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.missingUnit(inventory.units(), gwoGroup.orbital)) {
        chance = gwoCard.travelledShort(
          system,
          context,
          GW.balance.numberOfSystems
        )
          ? 250
          : 100;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.orbital);
    },
    dull: function () {},
  };
});
