define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: function () {
      if (gwoCard.isEnglish()) {
        return "!LOC:Complete Energy Tech reduces energy costs for intelligence structures by 75%, weapon energy costs by 75%, and teleport energy costs by 75%.";
      }
      return "!LOC:Complete Energy Tech reduces energy costs for intelligence structures by 75%, weapon energy costs by 75%.";
    },
    summarize: _.constant("!LOC:Complete Energy Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_energy.png",
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_efficiency",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      var sizes = GW.balance.numberOfSystems;
      if (gwoCard.travelledFar(system, context, sizes)) {
        return { chance: 60 };
      }
      return {
        chance: gwoCard.travelledModerate(system, context, sizes) ? 30 : 15,
      };
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
          },
        );
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
