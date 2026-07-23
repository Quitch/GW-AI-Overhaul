define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Air Ammunition Tech increases damage of all mobile air units by 25%"
    ),
    summarize: _.constant("!LOC:Air Ammunition Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.conditionalDeal(
        gwoCard.hasUnit(inventory.units(), gwoGroup.airMobileNoCluster),
        70
      );
    },
    buff: function (inventory) {
      var mods = _.flatten(
        _.map(gwoGroup.airAmmo, function (ammo) {
          return [
            {
              file: ammo,
              path: "damage",
              op: "multiply",
              value: 1.25,
            },
            {
              file: ammo,
              path: "splash_damage",
              op: "multiply",
              value: 1.25,
            },
          ];
        })
      );
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
