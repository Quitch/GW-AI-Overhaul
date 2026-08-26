define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Bot Combat Tech increases health of all bots by 50%, damage by 25%, and speed by 50%"
    ),
    summarize: _.constant("!LOC:Bot Combat Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_combat.png"
    ),
    audio: _.constant({
      found: "PA/VO/Computer/gw/board_tech_available_combat",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var sizes = GW.balance.numberOfSystems;
      return gwoCard.conditionalDeal(
        gwoCard.hasUnit(inventory.units(), gwoGroup.botsMobileNoCluster),
        gwoCard.travelledShort(system, context, sizes) ? 60 : 30
      );
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .flatMapMods(
            gwoGroup.botsMobile,
            "multiply",
            _.assign(gwoCard.eachPath(gwoCard.paths.navigation, 1.5), {
              max_health: 1.5,
            })
          )
          .concat(
            gwoCard.flatMapMods(
              gwoGroup.botsAmmo,
              "multiply",
              gwoCard.paths.damage,
              1.25
            )
          )
      );
    },
    dull: function () {},
  };
});
