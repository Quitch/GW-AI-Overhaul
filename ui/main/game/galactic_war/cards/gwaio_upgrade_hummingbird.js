define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Hummingbird Upgrade Tech adds the ability for fighters to move between planets."
        )
      )
    ),
    summarize: _.constant("!LOC:Hummingbird Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_air_engine_upgrade.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_speed" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.hummingbird)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.hummingbird, "replace", {
            system_velocity_multiplier: 30,
            gravwell_velocity_multiplier: 10,
            "navigation.inter_planetary_type": "system",
          })
          .concat(
            gwoCard.mods(gwoUnit.hummingbird, "push", {
              unit_types: "UNITTYPE_Interplanetary",
            })
          )
      );
    },
    dull: function () {},
  };
});
