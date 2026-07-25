define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Improved Energy Weapons tech reduces energy costs for energy based weapons by 75%"
    ),
    summarize: _.constant("!LOC:Improved Energy Weapons"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_energy.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_weapon_upgrade",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      var sizes = GW.balance.numberOfSystems;
      if (gwoCard.travelledFar(system, context, sizes)) {
        return { chance: 130 };
      }
      return {
        chance: gwoCard.travelledModerate(system, context, sizes) ? 65 : 28,
      };
    },
    buff: function (inventory) {
      var mods = _.flatten(
        _.map(gwoGroup.energyWeapons, function (weapon) {
          return [
            {
              file: weapon,
              path: "ammo_capacity",
              op: "multiply",
              value: 0.25,
            },
            {
              file: weapon,
              path: "ammo_demand",
              op: "multiply",
              value: 0.25,
            },
            {
              file: weapon,
              path: "ammo_per_shot",
              op: "multiply",
              value: 0.25,
            },
          ];
        })
      );
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
