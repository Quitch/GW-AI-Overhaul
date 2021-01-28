define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
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
    deal: function (unused0, unused1, inventory) {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/sea/drone_carrier/drone/drone.json"
        ) &&
        (((gwaioFunctions.hasUnit(
          "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_navalfactory")) &&
          gwaioFunctions.hasUnit(
            "/pa/units/sea/drone_carrier/carrier/carrier.json"
          )) ||
          inventory.hasCard("gwaio_upgrade_omega") ||
          inventory.hasCard("gwaio_upgrade_wyrm"))
      )
        chance = 70;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/sea/drone_carrier/drone/drone.json",
          path: "passive_health_regen",
          op: "multiply",
          value: 0.5,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
