define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoUnit, gwoGroup) {
  return {
    commanderUnits: [gwoUnit.commander],
    commanderWeapons: [gwoUnit.commanderSecondary],
    commanderAmmo: [
      gwoUnit.commanderAAAmmo,
      gwoUnit.commanderAmmo,
      gwoUnit.commanderSecondaryAmmo,
      gwoUnit.commanderTorpedoAmmo,
    ],
    commanderBuildArms: [gwoUnit.commanderBuildArm],

    legonisUnitsNotMobile: [
      gwoUnit.vehicleFactory,
      gwoUnit.vehicleFactoryAdvanced,
    ],
    legonisUnitsMobile: gwoGroup.vehiclesMobile.concat(gwoUnit.ares),
    legonisWeapons: [],
    legonisAmmo: gwoGroup.vehiclesAmmo.concat(
      gwoUnit.aresAmmo,
      gwoUnit.aresSecondaryAmmo,
      gwoUnit.aresStompAmmo
    ),
    legonisBuildArms: [
      gwoUnit.vehicleFabberAdvancedBuildArm,
      gwoUnit.vehicleFabberBuildArm,
      gwoUnit.vehicleFactoryAdvancedBuildArm,
      gwoUnit.vehicleFactoryBuildArm,
    ],

    foundationUnitsNotMobile: [
      gwoUnit.airFactory,
      gwoUnit.airFactoryAdvanced,
      gwoUnit.navalFactory,
      gwoUnit.navalFactoryAdvanced,
    ],
    foundationUnitsMobileAir: gwoGroup.airMobile.concat(gwoUnit.zeus),
    foundationUnitsMobileNotAir: gwoGroup.navalMobile,
    foundationWeapons: [
      gwoUnit.bumblebeeWeapon,
      gwoUnit.hornetWeapon,
      gwoUnit.icarusWeapon,
      gwoUnit.typhoonWeapon,
      gwoUnit.wyrmWeapon,
      gwoUnit.zeusWeapon,
    ],
    foundationAmmo: gwoGroup.airAmmo.concat(
      gwoGroup.navalAmmo,
      gwoUnit.zeusAmmo
    ),
    foundationBuildArms: [
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
    ],

    synchronousUnitsNotMobile: [gwoUnit.botFactoryAdvanced, gwoUnit.botFactory],
    synchronousUnitsMobile: gwoGroup.botsMobile.concat(gwoUnit.atlas),
    synchronousWeapons: [gwoUnit.lobWeapon, gwoUnit.sparkWeapon],
    synchronousAmmo: gwoGroup.botsAmmo.concat(gwoUnit.atlasAmmo),
    synchronousBuildArms: [
      gwoUnit.botFabberAdvancedBuildArm,
      gwoUnit.botFabberBuildArm,
      gwoUnit.botFactoryAdvancedBuildArm,
      gwoUnit.botFactoryBuildArm,
      gwoUnit.colonelBuildArm,
      gwoUnit.mendBuildArm,
      gwoUnit.stitchBuildArm,
    ],

    revenantsUnitsNotMobile: [
      gwoUnit.anchor,
      gwoUnit.catalyst,
      gwoUnit.deepSpaceOrbitalRadar,
      gwoUnit.halley,
      gwoUnit.jig,
      gwoUnit.nukeLauncher,
      gwoUnit.nukeLauncherAmmo,
      gwoUnit.orbitalFactory,
      gwoUnit.orbitalLauncher,
      gwoUnit.umbrella,
      gwoUnit.unitCannon,
    ],
    revenantsUnitsMobile: gwoGroup.orbitalMobile.concat(gwoUnit.helios),
    revenantsWeapons: [gwoUnit.sxxWeapon, gwoUnit.artemisWeapon],
    revenantsAmmo: gwoGroup.orbitalAmmo.concat(
      gwoUnit.anchorAmmoAG,
      gwoUnit.anchorAmmoAO
    ),
    revenantsBuildArms: [
      gwoUnit.nukeLauncherBuildArm,
      gwoUnit.orbitalFabberBuildArm,
      gwoUnit.orbitalFactoryBuildArm,
      gwoUnit.orbitalLauncherBuildArm,
      gwoUnit.unitCannonBuildArm,
    ],

    clusterCommanders: [gwoUnit.angel, gwoUnit.colonel],
    clusterCommanderAmmo: [gwoUnit.angelAmmo, gwoUnit.colonelAmmo],
    clusterUnits: gwoGroup.structures.concat(gwoUnit.ragnarok),
    clusterWeapons: [
      gwoUnit.holkinsWeapon,
      gwoUnit.lob,
      gwoUnit.pelterWeapon,
      gwoUnit.ragnarokWeapon,
    ],
    clusterAmmo: gwoGroup.structuresDefencesAmmo.concat(
      gwoGroup.structuresArtilleryAmmo
    ),
    clusterBuildArms: [
      gwoUnit.airFactoryAdvancedBuildArm,
      gwoUnit.airFactoryBuildArm,
      gwoUnit.antiNukeLauncherBuildArm,
      gwoUnit.botFactoryAdvancedBuildArm,
      gwoUnit.botFactoryAdvancedBuildArm,
      gwoUnit.botFactoryBuildArm,
      gwoUnit.botFactoryBuildArm,
      gwoUnit.navalFactoryAdvancedBuildArm,
      gwoUnit.navalFactoryBuildArm,
      gwoUnit.nukeLauncherBuildArm,
      gwoUnit.orbitalFactoryBuildArm,
      gwoUnit.orbitalLauncherBuildArm,
      gwoUnit.unitCannonBuildArm,
      gwoUnit.vehicleFactoryAdvancedBuildArm,
      gwoUnit.vehicleFactoryBuildArm,
    ],
  };
});
