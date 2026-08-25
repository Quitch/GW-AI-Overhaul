define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Manhattan Upgrade Tech doubles the radius of the mobile nuke's explosion."
        )
      )
    ),
    summarize: _.constant("!LOC:Manhattan Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.manhattan)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard.mods(gwoUnit.manhattanDeath, "multiply", {
          splash_radius: 2,
          full_damage_splash_radius: 2,
          burn_radius: 2,
          "damage_volume.initial_radius": 2,
          "damage_volume.radius_velocity": 2,
          "damage_volume.burnable_remove_radius": 2,
        })
      );
    },
    dull: function () {},
  };
});
