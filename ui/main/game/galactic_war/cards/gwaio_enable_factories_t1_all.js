define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (GW, gwoCard, gwoGroup, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Complete Basic Tech enables building of basic air, bot, and vehicle units and factories. Basic factories are built via your commander or any basic fabricator."
    ),
    summarize: _.constant("!LOC:Complete Basic Factory Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_vehicle",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      const basicFactories = [
        gwoUnit.airFactory,
        gwoUnit.botFactory,
        gwoUnit.vehicleFactory,
      ];
      if (!gwoCard.hasUnit(inventory.units(), basicFactories)) {
        const dist = system.distance();
        if (
          (context.totalSize <= GW.balance.numberOfSystems[0] && dist > 2) ||
          (context.totalSize <= GW.balance.numberOfSystems[1] && dist > 3) ||
          (context.totalSize <= GW.balance.numberOfSystems[2] && dist > 4) ||
          (context.totalSize <= GW.balance.numberOfSystems[3] && dist > 5) ||
          dist > 6
        ) {
          chance = 25;
        } else {
          chance = 250;
        }
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(
        gwoGroup.airBasic.concat(gwoGroup.botsBasic, gwoGroup.vehiclesBasic)
      );
    },
    dull: function () {},
  };
});
