define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoAI, gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Orbital Fabrication Bot Upgrade Tech allows the orbital fabricator to build all basic structures."
        )
      )
    ),
    summarize: _.constant("!LOC:Orbital Fabrication Bot Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_orbital",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        !inventory.hasCard("nem_start_deepspace") &&
          gwoCard.hasUnit(inventory.units(), gwoUnit.orbitalFabber)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard.mods(gwoUnit.orbitalFabber, "add", {
          buildable_types:
            " | (Land & Structure & Basic | Factory & Basic | FabBuild) & Custom58",
        })
      );

      var structures = [
        "BasicAirDefense",
        "BasicAirFactory",
        "BasicArtillery",
        "BasicBotFactory",
        "BasicEnergyGenerator",
        "BasicLandDefense",
        "BasicLandDefenseSingle",
        "BasicRadar",
        "BasicVehicleFactory",
        "EnergyStorage",
        "MetalStorage",
        "OrbitalLauncher",
        "Umbrella",
        "Wall",
      ];
      inventory.addAIMods(
        gwoAI.builderAppendMods("fabber", structures, "OrbitalFabber")
      );
    },
    dull: function () {},
  };
});
