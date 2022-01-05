define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Omega Upgrade Tech replaces the battleship's underside laser with an SXX laser."
    ),
    summarize: _.constant("!LOC:Omega Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function () {
      var chance = 0;
      if (
        gwaioCards.hasUnit(gwaioUnits.orbitalFactory) &&
        gwaioCards.hasUnit(gwaioUnits.omega) &&
        gwaioCards.hasUnit(gwaioUnits.squall)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.omega,
          path: "tools.4.spec_id",
          op: "replace",
          value:
            "/pa/units/orbital/orbital_laser/orbital_laser_tool_weapon.json",
        },
        {
          file: gwaioUnits.omega,
          path: "attack_range_frac",
          op: "replace",
          value: 0.3,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
