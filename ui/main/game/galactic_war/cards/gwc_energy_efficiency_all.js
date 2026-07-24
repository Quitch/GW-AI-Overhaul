define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Complete Energy Tech reduces energy costs for intelligence structures by 75%, weapon energy costs by 75%."
    ),
    summarize: _.constant("!LOC:Complete Energy Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_energy.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_efficiency",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      var chance = 33;
      // Outer edge -> 166; the mid-distance band peaks higher at 333 (preserving the
      // original non-monotonic shape). Both ladders re-centred on star distance.
      if (gwoCard.travelledFar(system, context, GW.balance.numberOfSystems)) {
        chance = 166;
      } else if (
        gwoCard.farForSize(
          system,
          context,
          GW.balance.numberOfSystems,
          [2, 3, 5, 6, 7, 8, 9, 10, 11]
        )
      ) {
        chance = 333;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [];
      _.forEach(gwoGroup.energyIntel, function (unit) {
        mods.push({
          file: unit,
          path: "consumption.energy",
          op: "multiply",
          value: 0.25,
        });
      });
      _.forEach(gwoGroup.teleporters, function (unit) {
        mods.push({
          file: unit,
          path: "teleporter.energy_demand",
          op: "multiply",
          value: 0.25,
        });
      });
      _.forEach(gwoGroup.energyWeapons, function (weapon) {
        mods.push(
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
          }
        );
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
