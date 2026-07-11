define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoUnit, gwoGroup) {
  var commanderUnits = [gwoUnit.commander];
  var legonisUnitsImmobile = [
    gwoUnit.vehicleFactory,
    gwoUnit.vehicleFactoryAdvanced,
  ];
  var legonisUnitsMobile = gwoGroup.vehiclesMobile.concat(gwoUnit.ares);
  var foundationUnitsImmobile = [
    gwoUnit.airFactory,
    gwoUnit.airFactoryAdvanced,
    gwoUnit.navalFactory,
    gwoUnit.navalFactoryAdvanced,
  ];
  var foundationUnitsMobileAir = gwoGroup.airMobile.concat(
    gwoUnit.zeus,
    gwoUnit.squall
  );
  var foundationUnitsMobileNaval = _.without(
    gwoGroup.navalMobile,
    gwoUnit.squall
  );
  var synchronousUnitsImmobile = [
    gwoUnit.botFactoryAdvanced,
    gwoUnit.botFactory,
  ];
  var synchronousUnitsMobile = gwoGroup.botsMobile.concat(gwoUnit.atlas);
  var revenantsUnitsImmobile = [
    gwoUnit.anchor,
    gwoUnit.antiNukeLauncher,
    gwoUnit.catalyst,
    gwoUnit.deepSpaceOrbitalRadar,
    gwoUnit.halley,
    gwoUnit.jig,
    gwoUnit.kessler, // not immobile but matching how the cards handle it
    gwoUnit.nukeLauncher,
    gwoUnit.orbitalFactory,
    gwoUnit.orbitalLauncher,
    gwoUnit.umbrella,
    gwoUnit.unitCannon,
  ];
  var revenantsUnitsImmobileWithAmmo = revenantsUnitsImmobile.concat(
    gwoUnit.antiNukeLauncherAmmo,
    gwoUnit.nukeLauncherAmmo
  );
  var revenantsUnitsFactories = [
    gwoUnit.antiNukeLauncher,
    gwoUnit.nukeLauncher,
    gwoUnit.orbitalFactory,
    gwoUnit.orbitalLauncher,
  ];
  var revenantsUnitsMobile = gwoGroup.orbitalMobile.concat(gwoUnit.helios);
  var clusterCommanders = commanderUnits.concat(gwoUnit.angel, gwoUnit.colonel);
  var clusterUnitsMobile = clusterCommanders;
  var clusterUnitsImmobile = gwoGroup.structures.concat(gwoUnit.ragnarok);
  var clusterUnitsFactories = gwoGroup.factories;

  var commanderAmmo = [
    gwoUnit.commanderAAAmmo,
    gwoUnit.commanderAmmo,
    gwoUnit.commanderSecondaryAmmo,
    gwoUnit.commanderTorpedoLandAmmo,
    gwoUnit.commanderTorpedoWaterAmmo,
  ];
  var legonisAmmo = gwoGroup.vehiclesAmmo.concat(
    gwoUnit.aresAmmo,
    gwoUnit.aresSecondaryAmmo
  );
  var foundationAmmo = gwoGroup.airAmmo.concat(
    gwoGroup.navalAmmo,
    gwoUnit.zeusAmmo
  );
  var synchronousAmmo = gwoGroup.botsAmmo.concat(gwoUnit.atlasAmmo);
  var revenantsAmmo = gwoGroup.orbitalAmmo.concat(
    gwoUnit.anchorAmmoAG,
    gwoUnit.anchorAmmoAO,
    gwoUnit.heliosAmmo,
    gwoUnit.kesslerAmmo
  );
  var clusterCommanderAmmo = [gwoUnit.angelAmmo, gwoUnit.colonelAmmo];
  var clusterAmmo = gwoGroup.structuresDefencesAmmo.concat(
    gwoGroup.structuresArtilleryAmmo
  );

  var commanderWeapons = [gwoUnit.commanderSecondary];
  var foundationWeapons = [
    gwoUnit.bumblebeeWeapon,
    gwoUnit.hornetWeapon,
    gwoUnit.icarusWeapon,
    gwoUnit.typhoonWeapon,
    gwoUnit.wyrmWeapon,
    gwoUnit.zeusWeapon,
  ];
  var synchronousWeapons = [gwoUnit.lobWeapon, gwoUnit.sparkWeapon];
  var revenantsWeapons = [gwoUnit.sxxWeapon, gwoUnit.artemisWeapon];
  var clusterWeapons = [
    gwoUnit.holkinsWeapon,
    gwoUnit.lobWeapon,
    gwoUnit.pelterWeapon,
    gwoUnit.ragnarokWeapon,
  ];

  var commanderBuildArms = [gwoUnit.commanderBuildArm];
  var legonisBuildArms = [
    gwoUnit.vehicleFabberAdvancedBuildArm,
    gwoUnit.vehicleFabberBuildArm,
    gwoUnit.vehicleFactoryAdvancedBuildArm,
    gwoUnit.vehicleFactoryBuildArm,
  ];
  var foundationBuildArms = [
    gwoUnit.airFabberAdvancedBuildArm,
    gwoUnit.airFabberBuildArm,
    gwoUnit.airFactoryAdvancedBuildArm,
    gwoUnit.airFactoryBuildArm,
    gwoUnit.angelBuildArm,
    gwoUnit.barnacleBuildArm,
    gwoUnit.navalFabberAdvancedBuildArm,
    gwoUnit.navalFabberBuildArm,
    gwoUnit.navalFactoryAdvancedBuildArm,
    gwoUnit.navalFactoryBuildArm,
  ];
  var synchronousBuildArms = [
    gwoUnit.botFabberAdvancedBuildArm,
    gwoUnit.botFabberBuildArm,
    gwoUnit.botFactoryAdvancedBuildArm,
    gwoUnit.botFactoryBuildArm,
    gwoUnit.colonelBuildArm,
    gwoUnit.mendBuildArm,
    gwoUnit.stitchBuildArm,
  ];
  var revenantsBuildArms = [
    gwoUnit.antiNukeLauncherBuildArm,
    gwoUnit.nukeLauncherBuildArm,
    gwoUnit.orbitalFabberBuildArm,
    gwoUnit.orbitalFactoryBuildArm,
    gwoUnit.orbitalLauncherBuildArm,
    gwoUnit.unitCannonBuildArm,
  ];
  var clusterBuildArms = [
    gwoUnit.airFactoryAdvancedBuildArm,
    gwoUnit.airFactoryBuildArm,
    gwoUnit.antiNukeLauncherBuildArm,
    gwoUnit.botFactoryAdvancedBuildArm,
    gwoUnit.botFactoryBuildArm,
    gwoUnit.navalFactoryAdvancedBuildArm,
    gwoUnit.navalFactoryBuildArm,
    gwoUnit.nukeLauncherBuildArm,
    gwoUnit.orbitalFactoryBuildArm,
    gwoUnit.orbitalLauncherBuildArm,
    gwoUnit.unitCannonBuildArm,
    gwoUnit.vehicleFactoryAdvancedBuildArm,
    gwoUnit.vehicleFactoryBuildArm,
  ];

  return {
    commanderUnits: commanderUnits,
    commanderWeapons: commanderWeapons,
    commanderBuildArms: commanderBuildArms,

    legonisUnitsImmobile: legonisUnitsImmobile,
    legonisUnitsMobile: legonisUnitsMobile,
    legonisUnits: legonisUnitsImmobile.concat(legonisUnitsMobile),
    legonisWeapons: commanderWeapons,
    legonisAmmo: legonisAmmo.concat(commanderAmmo),
    legonisBuildArms: legonisBuildArms.concat(commanderBuildArms),

    foundationUnitsImmobile: foundationUnitsImmobile,
    foundationUnitsMobileAir: foundationUnitsMobileAir,
    foundationUnitsMobileNaval: foundationUnitsMobileNaval,
    foundationUnits: foundationUnitsMobileAir.concat(
      foundationUnitsMobileNaval,
      foundationUnitsImmobile
    ),
    foundationWeapons: foundationWeapons.concat(commanderWeapons),
    foundationAmmo: foundationAmmo.concat(commanderAmmo),
    foundationBuildArms: foundationBuildArms.concat(commanderBuildArms),

    synchronousUnitsImmobile: synchronousUnitsImmobile,
    synchronousUnitsMobile: synchronousUnitsMobile,
    synchronousUnits: synchronousUnitsMobile.concat(synchronousUnitsImmobile),
    synchronousWeapons: synchronousWeapons.concat(commanderWeapons),
    synchronousAmmo: synchronousAmmo.concat(commanderAmmo),
    synchronousBuildArms: synchronousBuildArms.concat(commanderBuildArms),

    revenantsUnitsImmobile: revenantsUnitsImmobile,
    revenantsUnitsImmobileWithAmmo: revenantsUnitsImmobileWithAmmo,
    revenantsUnitsMobile: revenantsUnitsMobile,
    revenantsUnitsWithAmmo: revenantsUnitsMobile.concat(
      revenantsUnitsImmobileWithAmmo
    ),
    revenantsUnitsFactories: revenantsUnitsFactories,
    revenantsUnits: revenantsUnitsMobile.concat(revenantsUnitsImmobile),
    revenantsWeapons: revenantsWeapons.concat(commanderWeapons),
    revenantsAmmo: revenantsAmmo.concat(commanderAmmo),
    revenantsBuildArms: revenantsBuildArms.concat(commanderBuildArms),

    clusterCommanders: clusterCommanders,
    clusterCommanderAmmo: clusterCommanderAmmo,
    clusterUnitsMobile: clusterUnitsMobile,
    clusterUnitsImmobile: clusterUnitsImmobile,
    clusterUnitsFactories: clusterUnitsFactories,
    clusterUnits: clusterUnitsMobile.concat(clusterUnitsImmobile),
    clusterWeapons: clusterWeapons.concat(commanderWeapons),
    clusterAmmo: clusterAmmo.concat(commanderAmmo, clusterCommanderAmmo),
    clusterBuildArms: clusterBuildArms.concat(commanderBuildArms),
  };
});
