define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (GW, gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Complete Basic Tech enables building of basic air, bot, and vehicle units and factories. Basic factories are built via your commander or any basic fabricator.",

  summarize: () => "!LOC:Complete Basic Factory Tech",

  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_vehicle",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    const basicFactories = gwoGroup.landFactoriesBasic;
    let chance = 0;
    if (gwoCard.missingUnit(inventory.units(), basicFactories)) {
      chance = gwoCard.travelledShort(
        system,
        context,
        GW.balance.numberOfSystems,
      )
        ? 25
        : 250;
    }
    if (gwoCard.missingAllUnits(inventory.units(), basicFactories)) {
      chance *= 3;
    }
    return { chance };
  },

  buff: function (inventory) {
    inventory.addUnits(
      gwoGroup.airBasic.concat(gwoGroup.botsBasic, gwoGroup.vehiclesBasic),
    );
  },

  dull: function () {},
}));
