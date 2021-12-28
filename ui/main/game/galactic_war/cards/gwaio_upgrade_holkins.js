define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Holkins Upgrade Tech triples the number of shots fired per volley by the advanced artillery while also tripling their deviation from target."
    ),
    summarize: _.constant("!LOC:Holkins Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_artillery_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function () {
      var chance = 0;
      if (gwaioCards.hasUnit(gwaioUnits.holkins)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.holkins,
          path: "tools.0.projectiles_per_fire",
          op: "replace",
          value: 3,
        },
        {
          file: gwaioUnits.holkins,
          path: "tools.0.muzzle_bone",
          op: "replace",
          value: ["socket_muzzle", "socket_muzzle", "socket_muzzle"],
        },
        {
          file: gwaioUnits.holkinsWeapon,
          path: "firing_standard_deviation",
          op: "multiply",
          value: 3,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
