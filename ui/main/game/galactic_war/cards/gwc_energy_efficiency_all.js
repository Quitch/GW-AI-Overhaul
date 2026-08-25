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
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_energy.png"
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
      inventory.addMods(
        gwoCard
          .flatMapMods(gwoGroup.energyIntel, "multiply", {
            "consumption.energy": 0.25,
          })
          .concat(
            gwoCard.flatMapMods(gwoGroup.teleporters, "multiply", {
              "teleporter.energy_demand": 0.25,
            }),
            gwoCard.flatMapMods(gwoGroup.energyWeapons, "multiply", {
              ammo_capacity: 0.25,
              ammo_demand: 0.25,
              ammo_per_shot: 0.25,
            })
          )
      );
    },
    dull: function () {},
  };
});
