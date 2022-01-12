define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Unit Cannon Upgrade Tech doubles the launch capacity of this interplanetary transport and removes all cooldowns."
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
      if (gwaioCards.hasUnit(inventory.units(), gwaioUnits.unitCannon)) {
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
        {
          file: gwaioUnits.unitCannon,
          path: "factory_cooldown_time",
          op: "replace",
          value: 0,
        },
        {
          file: gwaioUnits.unitCannon,
          path: "wait_to_rolloff_time",
          op: "replace",
          value: 0,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
