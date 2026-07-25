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
      // Unlocking a fleet is only worth a data bank if there is water to sail it on,
      // so the distance ladder is scaled by the same water test as the other naval
      // cards. Full weight needs Tsunami here: a naval start already owns the lot,
      // which fails the missingUnit test above and zeroes this anyway.
      var chance = 0;
      if (gwoCard.missingUnit(inventory.units(), gwoGroup.naval)) {
        chance = gwoCard.navalWeight(
          inventory,
          gwoCard.travelledShort(system, context, GW.balance.numberOfSystems)
            ? 200
            : 25
        );
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.starterUnitsAdvanced.concat(gwoGroup.naval));
    },
    dull: function () {},
  };
});
