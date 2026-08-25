define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Astraeus Upgrade Tech increases the orbital lander's interplanetary movement speed by 200% and increases its carry capacity to 12 units."
        )
      )
    ),
    summarize: _.constant("!LOC:Astraeus Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_speed" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.astraeus)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard.mods(gwoUnit.astraeus, "multiply", {
          system_velocity_multiplier: 3,
          gravwell_velocity_multiplier: 3,
          "transporter.capacity": 12,
        })
      );
    },
    dull: function () {},
  };
});
