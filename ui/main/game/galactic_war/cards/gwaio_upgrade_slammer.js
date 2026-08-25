define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Slammer Upgrade Tech changes the advanced assault bot's torpedo into a rocket that targets surface units."
        )
      )
    ),
    summarize: _.constant("!LOC:Slammer Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.slammer)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.slammer, "replace", { "tools.1.show_range": true })
          .concat(
            gwoCard.mods(gwoUnit.slammerTorpedo, "replace", {
              spawn_layers: "WL_Air",
            }),
            gwoCard.mods(gwoUnit.slammerTorpedo, "push", {
              target_layers: "WL_LandHorizontal",
            }),
            gwoCard.mods(gwoUnit.slammerTorpedo, "replace", {
              target_priorities: ["Mobile", "Structure - Wall", "Wall"],
            }),
            gwoCard.mods(gwoUnit.slammerTorpedoLandAmmo, "replace", {
              flight_layer: "Air",
              spawn_layers: "WL_Air",
              cruise_height: 200,
            })
          )
      );
    },
    dull: function () {},
  };
});
