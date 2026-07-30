define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (GW, gwoCard, gwoUnit) {
  // Every build arm bar the Commander's own, which gwc_bld_efficiency_cdr covers.
  // Deliberately not gwoGroup.fabberBuildArms: that set includes the Commander and
  // omits the factory arms, so it is neither this card's list nor a subset of it.
  var buildArms = [
    gwoUnit.airFabberAdvancedBuildArm,
    gwoUnit.airFabberBuildArm,
    gwoUnit.airFactoryAdvancedBuildArm,
    gwoUnit.airFactoryBuildArm,
    gwoUnit.angelBuildArm,
    gwoUnit.antiNukeLauncherBuildArm,
    gwoUnit.barnacleBuildArm,
    gwoUnit.botFabberAdvancedBuildArm,
    gwoUnit.botFabberBuildArm,
    gwoUnit.botFactoryAdvancedBuildArm,
    gwoUnit.botFactoryBuildArm,
    gwoUnit.colonelBuildArm,
    gwoUnit.mendBuildArm,
    gwoUnit.navalFabberAdvancedBuildArm,
    gwoUnit.navalFabberBuildArm,
    gwoUnit.navalFactoryAdvancedBuildArm,
    gwoUnit.navalFactoryBuildArm,
    gwoUnit.orbitalFabberBuildArm,
    gwoUnit.orbitalFactoryBuildArm,
    gwoUnit.orbitalLauncherBuildArm,
    gwoUnit.stitchBuildArm,
    gwoUnit.vehicleFabberAdvancedBuildArm,
    gwoUnit.vehicleFabberBuildArm,
    gwoUnit.vehicleFactoryAdvancedBuildArm,
    gwoUnit.vehicleFactoryBuildArm,
  ];

  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Improved Fabricator Build Arms increase the build speed of all fabricator and factory build arms by 50% and reduces energy usage by 50%."
    ),
    summarize: _.constant("!LOC:Improved Fabricator Build Arms"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_metal.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_efficiency",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      var sizes = GW.balance.numberOfSystems;
      return {
        chance: gwoCard.travelledModerate(system, context, sizes) ? 80 : 16,
      };
    },
    buff: function (inventory) {
      inventory.addMods(
        _.flatten(
          _.map(buildArms, function (buildArm) {
            return gwoCard.mods(buildArm, "multiply", {
              "construction_demand.energy": 0.5,
              "construction_demand.metal": 1.5,
            });
          })
        )
      );
    },
    dull: function () {},
  };
});
