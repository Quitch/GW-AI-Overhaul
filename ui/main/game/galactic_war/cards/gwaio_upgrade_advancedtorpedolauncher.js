define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Advanced Torpedo Launcher Upgrade Tech enables the targeting of all surface units by the Advanced Torpedo Launcher."
        )
      )
    ),
    summarize: _.constant("!LOC:Advanced Torpedo Launcher Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_defense_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.torpedoLauncherAdvanced),
        30
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.torpedoLauncherAdvancedWeapon, "replace", {
            spawn_layers: "WL_Air",
          })
          .concat(
            gwoCard.mods(gwoUnit.torpedoLauncherAdvancedWeapon, "push", {
              target_layers: ["WL_LandHorizontal"],
            }),
            gwoCard.mods(gwoUnit.torpedoLauncherAdvancedWeapon, "replace", {
              exclude_unit_types: "",
            }),
            gwoCard.mods(gwoUnit.torpedoLauncherAdvancedLandAmmo, "replace", {
              flight_layer: "Air",
              spawn_layers: "WL_Air",
              cruise_height: 75,
            }),
            gwoCard.mods(gwoUnit.torpedoLauncherAdvancedWaterAmmo, "replace", {
              flight_layer: "Air",
              spawn_layers: "WL_Air",
              cruise_height: 75,
              initial_velocity: 100,
            })
          )
      );
    },
    dull: function () {},
  };
});
