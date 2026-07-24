define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Complete Naval Tech enables building of all naval units and all naval factories. Basic naval factories are built via your commander or any basic fabricator. Advanced naval factories are built via basic or advanced naval fabricators."
    ),
    summarize: _.constant("!LOC:Complete Naval Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_sea" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.missingUnit(inventory.units(), gwoGroup.naval)) {
        chance = gwoCard.travelledShort(
          system,
          context,
          GW.balance.numberOfSystems
        )
          ? 200
          : 25;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.starterUnitsAdvanced.concat(gwoGroup.naval));
    },
    dull: function () {},
  };
});
