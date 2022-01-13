define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwaioCards, gwaioGroups) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Air Ammunition Tech increases damage of all mobile air units by 25%"
    ),
    summarize: _.constant("!LOC:Air Ammunition Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwaioCards.hasUnit(inventory.units(), gwaioGroups.airMobile)) {
        chance = 70;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = _.map(gwaioGroups.airAmmo, function (ammo) {
        return {
          file: ammo,
          path: "damage",
          op: "multiply",
          value: 1.25,
        };
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
