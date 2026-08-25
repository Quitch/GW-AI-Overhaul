define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Ragnarok Upgrade Tech allows the titan structure to annihilate all life on a planet while leaving the planet itself intact. It may take up to 30 seconds before you can land safely after detonation."
        )
      )
    ),
    summarize: _.constant("!LOC:Ragnarok Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_super_weapons_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.ragnarok)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard.mods(gwoUnit.ragnarokPbaoe, "replace", {
          damage: 99999,
          full_damage_splash_radius: 99999,
          splash_damage: 99999,
          splash_damages_allies: true,
          splash_radius: 99999,
          "damage_volume.burnable_remove_radius": 100,
          "damage_volume.delay": 1.5,
          "damage_volume.initial_radius": 20,
          "damage_volume.radius_accel": -40,
          "damage_volume.radius_velocity": 500,
          burn_damage: 200,
          burn_radius: 99999,
          "planet_impact_spec.delay_time": 99999, // never resolves, so the planet survives the blast
        })
      );
    },
    dull: function () {},
  };
});
