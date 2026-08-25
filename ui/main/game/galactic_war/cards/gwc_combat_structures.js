define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Structure Combat Tech increases the health of all structures by 50%. Defensive structures also gain a 25% damage increase."
    ),
    summarize: _.constant("!LOC:Structure Combat Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_structure.png"
    ),
    audio: _.constant({
      found: "PA/VO/Computer/gw/board_tech_available_combat",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      var sizes = GW.balance.numberOfSystems;
      return {
        chance: gwoCard.travelledShort(system, context, sizes) ? 60 : 30,
      };
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .flatMapMods(gwoGroup.structures, "multiply", { max_health: 1.5 })
          .concat(
            gwoCard.flatMapMods(
              gwoGroup.structuresDefencesAmmo,
              "multiply",
              gwoCard.eachPath(gwoCard.paths.damage, 1.25)
            )
          )
      );
    },
    dull: function () {},
  };
});
