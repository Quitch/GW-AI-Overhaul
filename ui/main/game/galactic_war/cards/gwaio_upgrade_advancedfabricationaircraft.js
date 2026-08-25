define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Advanced Fabrication Aircraft Upgrade Tech adds the ability for the advanced fabricator to move between planets."
        )
      )
    ),
    summarize: _.constant("!LOC:Advanced Fabrication Aircraft Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_air" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.airFabberAdvanced)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.airFabberAdvanced, "replace", {
            system_velocity_multiplier: 30,
            gravwell_velocity_multiplier: 10,
            "navigation.inter_planetary_type": "system",
          })
          .concat(
            gwoCard.mods(gwoUnit.airFabberAdvanced, "push", {
              unit_types: "UNITTYPE_Interplanetary",
            })
          )
      );
    },
    dull: function () {},
  };
});
