define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: function () {
      if (gwoCard.isEnglish()) {
        return "!LOC:Artillery Ammunition Tech increases the damage of all artillery structures by 25% and reduces their ammunition cost by 90%. Requires technology to build artillery structures and units.";
      }
      return "!LOC:Artillery Ammunition Tech increases the damage of all artillery structures by 25% and reduces their energy usage by 90%. Requires technology to build artillery structures and units.";
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
      return gwoCard.conditionalDeal(
        gwoCard.hasUnit(inventory.units(), gwoGroup.structuresArtillery),
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
            gwoCard.flatMapMods(
              gwoGroup.structuresArtilleryWeapons,
              "multiply",
              { ammo_capacity: 0.1, ammo_demand: 0.1, ammo_per_shot: 0.1 }
            )
          )
      );
    },
    dull: function () {},
  };
});
