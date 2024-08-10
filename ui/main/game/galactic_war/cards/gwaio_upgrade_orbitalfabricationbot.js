define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Orbital Fabrication Bot Upgrade Tech allows the orbital fabricator to build all basic structures."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Orbital Fabrication Bot Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_orbital",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        !(
          inventory.hasCard("nem_start_deepspace") ||
          inventory.hasCard("gwc_start_orbital")
        ) &&
        gwoCard.hasUnit(inventory.units(), gwoUnit.orbitalFabber)
      ) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.orbitalFabber,
          path: "buildable_types",
          op: "add",
          value:
            " | (Land & Structure & Basic | Factory & Basic | FabBuild) & Custom58",
        },
      ]);

      const structures = [
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
      const aiMods = _.map(structures, function (structure) {
        return {
          type: "fabber",
          op: "append",
          toBuild: structure,
          idToMod: "builders",
          value: "OrbitalFabber",
        };
      });
      inventory.addAIMods(aiMods);
    },
    dull: function () {},
  };
});
