define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Unit Cannon Upgrade Tech doubles the launch capacity of this interplanetary transport."
    ),
    summarize: _.constant("!LOC:Unit Cannon Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        gwaioCards.hasUnit(gwaioUnits.unitCannon) &&
        (gwaioCards.hasUnit(gwaioUnits.airFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_airfactory") ||
          gwaioCards.hasUnit(gwaioUnits.botFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_botfactory") ||
          gwaioCards.hasUnit(gwaioUnits.navalFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_navalfactory") ||
          gwaioCards.hasUnit(gwaioUnits.vehicleFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_vehiclefactory"))
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.unitCannon,
          path: "factory.spawn_points",
          op: "push",
          value: [
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
            "socket_build",
          ],
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
