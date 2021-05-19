define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Squall Upgrade Tech increases the lifespan of drones by 50%."
    ),
    summarize: _.constant("!LOC:Squall Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context, inventory) {
      var hasCard = inventory.hasCard();
      var hasUnit = gwaioFunctions.hasUnit();
      var chance = 0;
      if (
        hasUnit("/pa/units/sea/drone_carrier/drone/drone.json") &&
        (((hasUnit("/pa/units/sea/naval_factory_adv/naval_factory_adv.json") ||
          hasCard("gwaio_upgrade_navalfactory")) &&
          hasUnit("/pa/units/sea/drone_carrier/carrier/carrier.json")) ||
          hasCard("gwaio_upgrade_omega") ||
          hasCard("gwaio_upgrade_wyrm"))
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/sea/drone_carrier/drone/drone.json",
          path: "passive_health_regen",
          op: "multiply",
          value: 0.5,
        },
      ]);
    },
    dull: function () {},
  };
});
