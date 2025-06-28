define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoUnit, gwoGroup) {
  const commanderUnits = [gwoUnit.commander];
  const legonisUnitsImmobile = [
    gwoUnit.vehicleFactory,
    gwoUnit.vehicleFactoryAdvanced,
  ];
  const legonisUnitsMobile = gwoGroup.vehiclesMobile.concat(gwoUnit.ares);
  const foundationUnitsImmobile = [
    gwoUnit.airFactory,
    gwoUnit.airFactoryAdvanced,
    gwoUnit.navalFactory,
    gwoUnit.navalFactoryAdvanced,
  ];
  const foundationUnitsMobileAir = gwoGroup.airMobile.concat(
    gwoUnit.zeus,
    gwoUnit.squall
  );
  const foundationUnitsMobileNaval = _.without(
    gwoGroup.navalMobile,
    gwoUnit.squall
  );
  const synchronousUnitsImmobile = [
    gwoUnit.botFactoryAdvanced,
    gwoUnit.botFactory,
  ];
  const synchronousUnitsMobile = gwoGroup.botsMobile.concat(gwoUnit.atlas);
  const revenantsUnitsImmobile = [
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
  const revenantsUnitsImmobileWithAmmo = revenantsUnitsImmobile.concat(
    gwoUnit.antiNukeLauncherAmmo,
    gwoUnit.nukeLauncherAmmo
  );
  const revenantsUnitsFactories = [
    gwoUnit.antiNukeLauncher,
    gwoUnit.nukeLauncher,
    gwoUnit.orbitalFactory,
    gwoUnit.orbitalLauncher,
  ];
  const revenantsUnitsMobile = gwoGroup.orbitalMobile.concat(gwoUnit.helios);
  const clusterCommanders = commanderUnits.concat(
    gwoUnit.angel,
    gwoUnit.colonel
  );
  const clusterUnitsMobile = clusterCommanders;
  const clusterUnitsImmobile = gwoGroup.structures.concat(gwoUnit.ragnarok);
  const clusterUnitsFactories = gwoGroup.factories;

  const commanderAmmo = [
    gwoUnit.commanderAAAmmo,
    gwoUnit.commanderAmmo,
    gwoUnit.commanderSecondaryAmmo,
    gwoUnit.commanderTorpedoLandAmmo,
    gwoUnit.commanderTorpedoWaterAmmo,
  ];
  const legonisAmmo = gwoGroup.vehiclesAmmo.concat(
    gwoUnit.aresAmmo,
    gwoUnit.aresSecondaryAmmo
  );
  const foundationAmmo = gwoGroup.airAmmo.concat(
    gwoGroup.navalAmmo,
    gwoUnit.zeusAmmo
  );
  const synchronousAmmo = gwoGroup.botsAmmo.concat(gwoUnit.atlasAmmo);
  const revenantsAmmo = gwoGroup.orbitalAmmo.concat(
    gwoUnit.anchorAmmoAG,
    gwoUnit.anchorAmmoAO,
    gwoUnit.heliosAmmo,
    gwoUnit.kesslerAmmo
  );
  const clusterCommanderAmmo = [gwoUnit.angelAmmo, gwoUnit.colonelAmmo];
  const clusterAmmo = gwoGroup.structuresDefencesAmmo.concat(
    gwoGroup.structuresArtilleryAmmo
  );

  const commanderWeapons = [gwoUnit.commanderSecondary];
  const foundationWeapons = [
    gwoUnit.bumblebeeWeapon,
    gwoUnit.hornetWeapon,
    gwoUnit.icarusWeapon,
    gwoUnit.typhoonWeapon,
    gwoUnit.wyrmWeapon,
    gwoUnit.zeusWeapon,
  ];
  const synchronousWeapons = [gwoUnit.lobWeapon, gwoUnit.sparkWeapon];
  const revenantsWeapons = [gwoUnit.sxxWeapon, gwoUnit.artemisWeapon];
  const clusterWeapons = [
    gwoUnit.holkinsWeapon,
    gwoUnit.lobWeapon,
    gwoUnit.pelterWeapon,
    gwoUnit.ragnarokWeapon,
  ];

  const commanderBuildArms = [gwoUnit.commanderBuildArm];
  const legonisBuildArms = [
    gwoUnit.vehicleFabberAdvancedBuildArm,
    gwoUnit.vehicleFabberBuildArm,
    gwoUnit.vehicleFactoryAdvancedBuildArm,
    gwoUnit.vehicleFactoryBuildArm,
  ];
  const foundationBuildArms = [
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
  const synchronousBuildArms = [
    gwoUnit.botFabberAdvancedBuildArm,
    gwoUnit.botFabberBuildArm,
    gwoUnit.botFactoryAdvancedBuildArm,
    gwoUnit.botFactoryBuildArm,
    gwoUnit.colonelBuildArm,
    gwoUnit.mendBuildArm,
    gwoUnit.stitchBuildArm,
  ];
  const revenantsBuildArms = [
    gwoUnit.antiNukeLauncherBuildArm,
    gwoUnit.nukeLauncherBuildArm,
    gwoUnit.orbitalFabberBuildArm,
    gwoUnit.orbitalFactoryBuildArm,
    gwoUnit.orbitalLauncherBuildArm,
    gwoUnit.unitCannonBuildArm,
  ];
  const clusterBuildArms = [
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
