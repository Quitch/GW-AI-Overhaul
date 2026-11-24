define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (GW, gwoCard, gwoGroup, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: function () {
      return "!LOC:Artillery Ammunition Tech increases the damage of all artillery structures by 25% and reduces their ammunition cost by 90%. Requires technology to build artillery structures and units.";
    },
    summarize: _.constant("!LOC:Artillery Ammunition Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_artillery.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var sizes = GW.balance.numberOfSystems;
      // Lob Upgrade Tech's time ammo takes no ammo-cost cut, and the Lob's
      // shell does no damage, so the card does nothing for an upgraded Lob.
      var artillery = inventory.hasCard("gwaio_upgrade_lob")
        ? _.without(gwoGroup.structuresArtillery, gwoUnit.lob)
        : gwoGroup.structuresArtillery;
      return gwoCard.conditionalDeal(
        gwoCard.hasUnit(inventory.units(), artillery),
        gwoCard.travelledShort(system, context, sizes) ? 70 : 35
      );
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .flatMapMods(
            gwoGroup.structuresArtilleryAmmo,
            "multiply",
            gwoCard.paths.damage,
            1.25
          )
          .concat(
            gwoCard.ammoCost(
              gwoCard.flatMapMods(
                gwoGroup.structuresArtilleryWeapons,
                "multiply",
                gwoCard.paths.energyWeapon,
                0.1
              )
            )
          )
      );
    },
    dull: function () {},
  };
});
