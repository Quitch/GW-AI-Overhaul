define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "shared/gw_common",
], function (gwoCard, gwoGroup, gwoUnit, GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Cooldown Tech halves the cooldown time between builds for all orbital factories."
    ),
    summarize: _.constant("!LOC:Orbital Cooldown Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_orbital",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var sizes = GW.balance.numberOfSystems;
      // The Orbital Launcher has no factory_cooldown_time
      return gwoCard.conditionalDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.orbitalFactory),
        gwoCard.travelledShort(system, context, sizes) ? 70 : 35
      );
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.flatMapMods(gwoGroup.orbitalFactories, "multiply", {
          factory_cooldown_time: 0.5,
        })
      );
    },
    dull: function () {},
  };
});
