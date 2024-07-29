define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"], function (
  gwoUnit
) {
  const airBasicMobile = [
    gwoUnit.airFabber,
    gwoUnit.bumblebee,
    gwoUnit.firefly,
    gwoUnit.hummingbird,
    gwoUnit.icarus,
    gwoUnit.pelican,
  ];
  const airAdvancedMobile = [
    gwoUnit.airFabberAdvanced,
    gwoUnit.angel,
    gwoUnit.hornet,
    gwoUnit.horsefly,
    gwoUnit.kestrel,
    gwoUnit.phoenix,
    gwoUnit.wyrm,
  ];
  const airBasicAmmo = [
    gwoUnit.bumblebeeAmmo,
    gwoUnit.fireflyAmmo,
    gwoUnit.hummingbirdAmmo,
    gwoUnit.icarusAmmo,
  ];
  const airBasicWeapons = [
    gwoUnit.bumblebeeWeapon,
    gwoUnit.fireflyWeapon,
    gwoUnit.hummingbirdWeapon,
    gwoUnit.icarusWeapon,
  ];
  const airAdvancedAmmo = [
    gwoUnit.angelAmmo,
    gwoUnit.hornetAmmo,
    gwoUnit.horseflyAmmo,
    gwoUnit.kestrelAmmo,
    gwoUnit.phoenixAmmo,
    gwoUnit.wyrmAmmo,
  ];
  const airAdvancedWeapons = [
    gwoUnit.hornetWeapon,
    gwoUnit.horseflyWeapon,
    gwoUnit.kestrelWeapon,
    gwoUnit.phoenixWeapon,
    gwoUnit.wyrmWeapon,
  ];
  const airBasic = airBasicMobile.concat(gwoUnit.airFactory);
  const airAdvanced = airAdvancedMobile.concat(gwoUnit.airFactoryAdvanced);
  const airAmmo = airBasicAmmo.concat(airAdvancedAmmo);
  const airWeapons = airBasicWeapons.concat(airAdvancedWeapons);
  const airMobile = airBasicMobile.concat(airAdvancedMobile);
  const airMobileNoCluster = _.filter(airMobile, function (unit) {
    return unit !== gwoUnit.angel;
  });
  const air = airBasic.concat(airAdvanced);

  const botsBasicMobile = [
    gwoUnit.boom,
    gwoUnit.botFabber,
    gwoUnit.dox,
    gwoUnit.grenadier,
    gwoUnit.spark,
    gwoUnit.stinger,
    gwoUnit.stitch,
  ];
  const botsBasicAmmo = [
    gwoUnit.boomAmmo,
    gwoUnit.doxAmmo,
    gwoUnit.grenadierAmmo,
    gwoUnit.sparkAmmo,
    gwoUnit.stingerAmmo,
  ];
  const botsBasicWeapons = [
    gwoUnit.boomWeapon,
    gwoUnit.doxWeapon,
    gwoUnit.grenadierWeapon,
    gwoUnit.sparkWeapon,
    gwoUnit.stingerWeapon,
  ];
  const botsAdvancedMobile = [
    gwoUnit.bluehawk,
    gwoUnit.botFabberAdvanced,
    gwoUnit.colonel,
    gwoUnit.gilE,
    gwoUnit.locusts,
    gwoUnit.mend,
    gwoUnit.slammer,
  ];
  const botsAdvancedAmmo = [
    gwoUnit.bluehawkAmmo,
    gwoUnit.colonelAmmo,
    gwoUnit.gilEAmmo,
    gwoUnit.locustsAmmo,
    gwoUnit.slammerAmmo,
    gwoUnit.slammerTorpedoLandAmmo,
    gwoUnit.slammerTorpedoWaterAmmo,
  ];
  const botsAdvancedWeapons = [
    gwoUnit.bluehawkWeapon,
    gwoUnit.colonelWeapon,
    gwoUnit.gileEWeapon,
    gwoUnit.locustsWeapon,
    gwoUnit.slammerTorpedo,
    gwoUnit.slammerWeapon,
  ];
  const botsBasic = botsBasicMobile.concat(gwoUnit.botFactory);
  const botsAdvanced = botsAdvancedMobile.concat(gwoUnit.botFactoryAdvanced);
  const botsAmmo = botsBasicAmmo.concat(botsAdvancedAmmo);
  const botsWeapons = botsBasicWeapons.concat(botsAdvancedWeapons);
  const botsMobile = botsBasicMobile.concat(botsAdvancedMobile);
  const botsMobileNoCluster = _.filter(botsMobile, function (unit) {
    return unit !== gwoUnit.colonel;
  });
  const bots = botsBasic.concat(botsAdvanced);

  const navalBasicMobile = [
    gwoUnit.barnacle,
    gwoUnit.barracuda,
    gwoUnit.narwhal,
    gwoUnit.navalFabber,
    gwoUnit.orca,
    gwoUnit.piranha,
  ];
  const navalBasicAmmo = [
    gwoUnit.barracudaAmmo,
    gwoUnit.narwhalAAAmmo,
    gwoUnit.narwhalAmmo,
    gwoUnit.narwhalTorpedoAmmo,
    gwoUnit.orcaAmmo,
    gwoUnit.piranhaAmmo,
  ];
  const navalBasicWeapons = [
    gwoUnit.barracudaWeapon,
    gwoUnit.narwhalAA,
    gwoUnit.narwhalTorpedo,
    gwoUnit.narwhalWeapon,
    gwoUnit.orcaWeapon,
    gwoUnit.piranhaWeapon,
  ];
  const navalAdvancedMobile = [
    gwoUnit.kaiju,
    gwoUnit.kraken,
    gwoUnit.leviathan,
    gwoUnit.navalFabberAdvanced,
    gwoUnit.squall,
    gwoUnit.stingray,
    gwoUnit.typhoon,
  ];
  const navalAdvancedAmmo = [
    gwoUnit.kaijuAmmo,
    gwoUnit.kaijuSecondaryAmmo,
    gwoUnit.krakenMissileAmmo,
    gwoUnit.krakenWeaponAmmo,
    gwoUnit.leviathanAmmo,
    gwoUnit.squallAmmo,
    gwoUnit.squallTorpedoAmmo,
    gwoUnit.stingrayAAAmmo,
    gwoUnit.stingrayAmmo,
    gwoUnit.typhoonAmmo,
  ];
  const navalAdvancedWeapons = [
    gwoUnit.kaijuSecondary,
    gwoUnit.kaijuWeapon,
    gwoUnit.krakenMissile,
    gwoUnit.krakenWeapon,
    gwoUnit.leviathanWeapon,
    gwoUnit.squallTorpedo,
    gwoUnit.squallWeapon,
    gwoUnit.stingrayAA,
    gwoUnit.stingrayWeapon,
    gwoUnit.typhoonWeapon,
  ];
  const navalBasic = navalBasicMobile.concat(gwoUnit.navalFactory);
  const navalAdvanced = navalAdvancedMobile.concat(
    gwoUnit.navalFactoryAdvanced
  );
  const navalAmmo = navalBasicAmmo.concat(navalAdvancedAmmo);
  const navalWeapons = navalBasicWeapons.concat(navalAdvancedWeapons);
  const navalMobile = navalBasicMobile.concat(navalAdvancedMobile);
  const naval = navalBasic.concat(navalAdvanced);

  const orbitalBasicMobile = [
    gwoUnit.arkyd,
    gwoUnit.astraeus,
    gwoUnit.avenger,
    gwoUnit.hermes,
    gwoUnit.orbitalFabber,
  ];
  const orbitalBasicAmmo = [gwoUnit.avengerAmmo];
  const orbitalBasicWeapons = [gwoUnit.avengerWeapon];
  const orbitalAdvancedMobile = [
    gwoUnit.artemis,
    gwoUnit.omega,
    gwoUnit.radarSatelliteAdvanced,
    gwoUnit.solarArray,
    gwoUnit.sxx,
  ];
  const orbitalAdvancedAmmo = [
    gwoUnit.artemisAmmo,
    gwoUnit.omegaAmmo,
    gwoUnit.omegaAmmoAG,
    gwoUnit.sxxAmmo,
  ];
  const orbitalAdvancedWeapons = [
    gwoUnit.artemisWeapon,
    gwoUnit.omegaWeapon,
    gwoUnit.omegaWeaponAG,
    gwoUnit.sxxWeapon,
  ];
  const orbitalBasic = orbitalBasicMobile.concat(gwoUnit.orbitalLauncher);
  const orbitalAdvanced = orbitalAdvancedMobile.concat(
    gwoUnit.orbitalFactory,
    gwoUnit.jig // this is how GW treats it
  );
  const orbitalAmmo = orbitalBasicAmmo.concat(orbitalAdvancedAmmo);
  const orbitalWeapons = orbitalBasicWeapons.concat(orbitalAdvancedWeapons);
  const orbitalMobile = orbitalBasicMobile.concat(orbitalAdvancedMobile);
  const orbital = orbitalBasic.concat(orbitalAdvanced);

  const structuresArtilleryBasic = [gwoUnit.lob, gwoUnit.pelter];
  const structuresArtilleryBasicAmmo = [gwoUnit.lobAmmo, gwoUnit.pelterAmmo];
  const structuresArtilleryBasicWeapon = [
    gwoUnit.lobWeapon,
    gwoUnit.pelterWeapon,
  ];
  const structuresArtilleryAdvanced = [gwoUnit.holkins];
  const structuresArtilleryAdvancedAmmo = [gwoUnit.holkinsAmmo];
  const structuresArtilleryAdvancedWeapons = [gwoUnit.holkinsWeapon];
  const structuresArtillery = structuresArtilleryBasic.concat(
    structuresArtilleryAdvanced
  );
  const structuresArtilleryAmmo = structuresArtilleryBasicAmmo.concat(
    structuresArtilleryAdvancedAmmo
  );
  const structuresArtilleryWeapons = structuresArtilleryBasicWeapon.concat(
    structuresArtilleryAdvancedWeapons
  );

  const structuresDefencesBasic = [
    gwoUnit.anchor,
    gwoUnit.galata,
    gwoUnit.landMine,
    gwoUnit.laserDefenseTower,
    gwoUnit.singleLaserDefenseTower,
    gwoUnit.torpedoLauncher,
    gwoUnit.umbrella,
    gwoUnit.wall,
  ];
  const structuresDefencesBasicAmmo = [
    gwoUnit.anchorAmmoAG,
    gwoUnit.anchorAmmoAO,
    gwoUnit.galataAmmo,
    gwoUnit.landMineAmmo,
    gwoUnit.laserDefenseTowerAmmo,
    gwoUnit.singleLaserDefenseTowerAmmo,
    gwoUnit.torpedoLauncherLandAmmo,
    gwoUnit.torpedoLauncherWaterAmmo,
    gwoUnit.umbrellaAmmo,
  ];
  const structuresDefencesBasicWeapons = [
    gwoUnit.anchorWeaponAG,
    gwoUnit.anchorWeaponAO,
    gwoUnit.galataWeapon,
    gwoUnit.landMineWeapon,
    gwoUnit.laserDefenseTowerWeapon,
    gwoUnit.singleLaserDefenseTowerWeapon,
    gwoUnit.torpedoLauncherWeapon,
    gwoUnit.umbrellaWeapon,
  ];
  const structuresDefencesAdvanced = [
    gwoUnit.catapult,
    gwoUnit.flak,
    gwoUnit.laserDefenseTowerAdvanced,
    gwoUnit.torpedoLauncherAdvanced,
    gwoUnit.antiNukeLauncher,
  ];
  const structuresDefencesAdvancedAmmo = [
    gwoUnit.catapultAmmo,
    gwoUnit.flakAmmo,
    gwoUnit.laserDefenseTowerAdvancedAmmo,
    gwoUnit.torpedoLauncherAdvancedLandAmmo,
    gwoUnit.torpedoLauncherAdvancedWaterAmmo,
  ];
  const structuresDefencesAdvancedWeapons = [
    gwoUnit.catapultWeapon,
    gwoUnit.flakWeapon,
    gwoUnit.laserDefenseTowerAdvancedWeapon,
    gwoUnit.torpedoLauncherAdvancedWeapon,
  ];
  const structuresDefencesAmmo = structuresDefencesBasicAmmo.concat(
    structuresDefencesAdvancedAmmo
  );
  const structuresDefencesWeapons = structuresDefencesBasicWeapons.concat(
    structuresDefencesAdvancedWeapons
  );
  const structuresDefences = structuresDefencesBasic.concat(
    structuresDefencesAdvanced
  );
  const structuresEcoBasic = [gwoUnit.energyPlant, gwoUnit.metalExtractor];
  const structuresEcoAdvanced = [
    gwoUnit.energyPlantAdvanced,
    gwoUnit.jig,
    gwoUnit.metalExtractorAdvanced,
  ];
  const structuresEcoStorage = [gwoUnit.energyStorage, gwoUnit.metalStorage];
  const structuresEco = structuresEcoBasic.concat(
    structuresEcoAdvanced,
    structuresEcoStorage
  );
  const structuresFactories = [
    gwoUnit.airFactory,
    gwoUnit.airFactoryAdvanced,
    gwoUnit.botFactory,
    gwoUnit.botFactoryAdvanced,
    gwoUnit.navalFactory,
    gwoUnit.navalFactoryAdvanced,
    gwoUnit.orbitalFactory,
    gwoUnit.orbitalLauncher,
    gwoUnit.unitCannon,
    gwoUnit.vehicleFactory,
    gwoUnit.vehicleFactoryAdvanced,
  ];
  const structuresIntelBasic = [gwoUnit.radar];
  const structuresIntelAdvanced = [
    gwoUnit.deepSpaceOrbitalRadar,
    gwoUnit.radarAdvanced,
    gwoUnit.radarJammingStation,
  ];
  const structuresIntel = structuresIntelBasic.concat(structuresIntelAdvanced);
  const structuresSuperWeapons = [
    gwoUnit.catalyst,
    gwoUnit.halley,
    gwoUnit.nukeLauncher,
  ];
  const structures = structuresFactories.concat(
    structuresDefences,
    structuresSuperWeapons,
    structuresIntel,
    structuresEco,
    structuresArtillery,
    gwoUnit.teleporter
  );

  const titans = [
    gwoUnit.ares,
    gwoUnit.atlas,
    gwoUnit.helios,
    gwoUnit.ragnarok,
    gwoUnit.zeus,
  ];
  const titansAmmo = [
    gwoUnit.aresAmmo,
    gwoUnit.aresSecondaryAmmo,
    gwoUnit.atlasAmmo,
    gwoUnit.heliosAmmo,
    gwoUnit.zeusAmmo,
  ];
  const titansWeapons = [
    gwoUnit.aresSecondary,
    gwoUnit.aresWeapon,
    gwoUnit.atlasWeapon,
    gwoUnit.heliosWeapon,
    gwoUnit.zeusWeapon,
  ];

  const vehiclesBasicMobile = [
    gwoUnit.ant,
    gwoUnit.drifter,
    gwoUnit.inferno,
    gwoUnit.skitter,
    gwoUnit.spinner,
    gwoUnit.stryker,
    gwoUnit.vehicleFabber,
  ];
  const vehiclesBasicAmmo = [
    gwoUnit.antAmmo,
    gwoUnit.drifterAmmo,
    gwoUnit.infernoAmmo,
    gwoUnit.skitterAmmo,
    gwoUnit.spinnerAmmo,
    gwoUnit.strykerAmmo,
  ];
  const vehiclesBasicWeapons = [
    gwoUnit.antWeapon,
    gwoUnit.drifterWeapon,
    gwoUnit.infernoWeapon,
    gwoUnit.skitterWeapon,
    gwoUnit.spinnerWeapon,
    gwoUnit.strykerWeapon,
  ];
  const vehiclesAdvancedMobile = [
    gwoUnit.leveler,
    gwoUnit.manhattan,
    gwoUnit.sheller,
    gwoUnit.storm,
    gwoUnit.vanguard,
    gwoUnit.vehicleFabberAdvanced,
  ];
  const vehiclesAdvancedAmmo = [
    gwoUnit.levelerAmmo,
    gwoUnit.shellerAmmo,
    gwoUnit.stormAmmo,
    gwoUnit.vanguardAmmo,
  ];
  const vehiclesAdvancedWeapons = [
    gwoUnit.levelerWeapon,
    gwoUnit.manhattanWeapon,
    gwoUnit.shellerWeapon,
    gwoUnit.stormWeapon,
    gwoUnit.vanguardWeapon,
  ];
  const vehiclesBasic = vehiclesBasicMobile.concat(gwoUnit.vehicleFactory);
  const vehiclesAdvanced = vehiclesAdvancedMobile.concat(
    gwoUnit.vehicleFactoryAdvanced
  );
  const vehiclesAmmo = vehiclesBasicAmmo.concat(vehiclesAdvancedAmmo);
  const vehiclesWeapons = vehiclesBasicWeapons.concat(vehiclesAdvancedWeapons);
  const vehiclesMobile = vehiclesBasicMobile.concat(vehiclesAdvancedMobile);
  const vehicles = vehiclesBasic.concat(vehiclesAdvanced);

  const unitCannonMobile = [
    gwoUnit.ant,
    gwoUnit.boom,
    gwoUnit.dox,
    gwoUnit.grenadier,
    gwoUnit.spark,
    gwoUnit.spinner,
    gwoUnit.stinger,
    gwoUnit.stitch,
    gwoUnit.storm,
    gwoUnit.stryker,
  ];

  const fabbersBasic = [
    gwoUnit.airFabber,
    gwoUnit.barnacle,
    gwoUnit.botFabber,
    gwoUnit.navalFabber,
    gwoUnit.orbitalFabber,
    gwoUnit.stitch,
    gwoUnit.vehicleFabber,
  ];
  const fabbersAdvanced = [
    gwoUnit.airFabberAdvanced,
    gwoUnit.angel,
    gwoUnit.botFabberAdvanced,
    gwoUnit.colonel,
    gwoUnit.mend,
    gwoUnit.navalFabberAdvanced,
    gwoUnit.vehicleFabberAdvanced,
  ];
  const fabbers = fabbersBasic.concat(fabbersAdvanced);

  // exclude orbital factories due to their fabber working differently
  const factoriesBasic = [
    gwoUnit.airFactory,
    gwoUnit.botFactory,
    gwoUnit.navalFactory,
    gwoUnit.vehicleFactory,
  ];
  const factoriesAdvanced = [
    gwoUnit.airFactoryAdvanced,
    gwoUnit.botFactoryAdvanced,
    gwoUnit.navalFactoryAdvanced,
    gwoUnit.vehicleFactoryAdvanced,
  ];
  const factories = factoriesBasic.concat(
    factoriesAdvanced,
    gwoUnit.antiNukeLauncher,
    gwoUnit.orbitalFactory,
    gwoUnit.orbitalLauncher,
    gwoUnit.unitCannon
  );

  const mobile = airMobile.concat(
    botsMobile,
    navalMobile,
    orbitalMobile,
    vehiclesMobile,
    gwoUnit.atlas,
    gwoUnit.ares,
    gwoUnit.zeus
  );
  const immobile = structures.concat(gwoUnit.ragnarok);
  const mobileNoCluster = airMobileNoCluster.concat(
    botsMobileNoCluster,
    navalMobile,
    orbitalMobile,
    vehiclesMobile,
    gwoUnit.atlas,
    gwoUnit.ares,
    gwoUnit.zeus
  );

  const energyIntel = structuresIntel.concat(
    gwoUnit.arkyd,
    gwoUnit.radarSatelliteAdvanced
  );
  const energyUnits = [
    gwoUnit.artemis,
    gwoUnit.bumblebee,
    gwoUnit.commander,
    gwoUnit.holkins,
    gwoUnit.icarus,
    gwoUnit.pelter,
    gwoUnit.spark,
    gwoUnit.sxx,
    gwoUnit.wyrm,
    gwoUnit.zeus,
  ];
  const energyAll = energyIntel.concat(energyUnits);
  const energyWeapons = [
    gwoUnit.artemisWeapon,
    gwoUnit.bumblebeeWeapon,
    gwoUnit.commanderSecondary,
    gwoUnit.holkinsWeapon,
    gwoUnit.icarusWeapon,
    gwoUnit.pelterWeapon,
    gwoUnit.sparkWeapon,
    gwoUnit.sxxWeapon,
    gwoUnit.wyrmWeapon,
    gwoUnit.zeusWeapon,
  ];

  const teleporters = [gwoUnit.teleporter, gwoUnit.helios];

  const ammo = airAmmo.concat(
    botsAmmo,
    navalAmmo,
    orbitalAmmo,
    structuresDefencesAmmo,
    titansAmmo,
    vehiclesAmmo
  );

  const weapons = airWeapons.concat(
    botsWeapons,
    navalWeapons,
    orbitalWeapons,
    structuresDefencesWeapons,
    titansWeapons,
    vehiclesWeapons
  );

  const units = mobile.concat(immobile);
  const unitsNoCluster = mobileNoCluster.concat(mobile);

  const clusterCommanders = [gwoUnit.angel, gwoUnit.colonel];

  const fabberBuildArms = [
    gwoUnit.airFabberAdvancedBuildArm,
    gwoUnit.airFabberBuildArm,
    gwoUnit.barnacleBuildArm,
    gwoUnit.botFabberAdvancedBuildArm,
    gwoUnit.botFabberBuildArm,
    gwoUnit.colonelBuildArm,
    gwoUnit.commanderBuildArm,
    gwoUnit.mendBuildArm,
    gwoUnit.navalFabberAdvancedBuildArm,
    gwoUnit.navalFabberBuildArm,
    gwoUnit.orbitalFabberBuildArm,
    gwoUnit.stitchBuildArm,
  ];

  // units all T2 fabbers have access to immediately
  const starterUnitsAdvanced = structuresSuperWeapons.concat(
    gwoUnit.antiNukeLauncher,
    gwoUnit.energyPlantAdvanced,
    gwoUnit.metalExtractorAdvanced,
    gwoUnit.radarAdvanced,
    gwoUnit.radarJammingStation,
    gwoUnit.unitCannon
  );

  const commanderAmmo = [
    gwoUnit.commanderAAAmmo,
    gwoUnit.commanderAmmo,
    gwoUnit.commanderSecondaryAmmo,
    gwoUnit.commanderTorpedoLandAmmo,
    gwoUnit.commanderTorpedoWaterAmmo,
  ];

  return {
    air: air,
    airAdvanced: airAdvanced,
    airAdvancedMobile: airAdvancedMobile,
    airAmmo: airAmmo,
    airBasic: airBasic,
    airBasicMobile: airBasicMobile,
    airMobile: airMobile,
    airMobileNoCluster: airMobileNoCluster,
    airWeapons: airWeapons,
    ammo: ammo,
    bots: bots,
    botsAdvanced: botsAdvanced,
    botsAdvancedMobile: botsAdvancedMobile,
    botsAmmo: botsAmmo,
    botsBasic: botsBasic,
    botsBasicMobile: botsBasicMobile,
    botsMobile: botsMobile,
    botsMobileNoCluster: botsMobileNoCluster,
    botsWeapons: botsWeapons,
    clusterCommanders: clusterCommanders,
    commanderAmmo: commanderAmmo,
    energyIntel: energyIntel,
    energyUnits: energyUnits,
    energyAll: energyAll,
    energyWeapons: energyWeapons,
    fabberBuildArms: fabberBuildArms,
    fabbers: fabbers,
    fabbersAdvanced: fabbersAdvanced,
    fabbersBasic: fabbersBasic,
    factories: factories,
    factoriesAdvanced: factoriesAdvanced,
    factoriesBasic: factoriesBasic,
    mobile: mobile,
    mobileNoCluster: mobileNoCluster,
    naval: naval,
    navalAdvanced: navalAdvanced,
    navalAdvancedMobile: navalAdvancedMobile,
    navalAmmo: navalAmmo,
    navalBasic: navalBasic,
    navalBasicMobile: navalBasicMobile,
    navalMobile: navalMobile,
    navalWeapons: navalWeapons,
    immobile: immobile,
    orbital: orbital,
    orbitalAdvanced: orbitalAdvanced,
    orbitalAdvancedMobile: orbitalAdvancedMobile,
    orbitalAmmo: orbitalAmmo,
    orbitalBasic: orbitalBasic,
    orbitalBasicMobile: orbitalBasicMobile,
    orbitalMobile: orbitalMobile,
    orbitalWeapons: orbitalWeapons,
    starterUnitsAdvanced: starterUnitsAdvanced,
    structures: structures,
    structuresArtillery: structuresArtillery,
    structuresArtilleryAdvanced: structuresArtilleryAdvanced,
    structuresArtilleryAmmo: structuresArtilleryAmmo,
    structuresArtilleryBasic: structuresArtilleryBasic,
    structuresArtilleryWeapons: structuresArtilleryWeapons,
    structuresDefences: structuresDefences,
    structuresDefencesAdvanced: structuresDefencesAdvanced,
    structuresDefencesAmmo: structuresDefencesAmmo,
    structuresDefencesBasic: structuresDefencesBasic,
    structuresDefencesWeapons: structuresDefencesWeapons,
    structuresEco: structuresEco,
    structuresEcoAdvanced: structuresEcoAdvanced,
    structuresEcoBasic: structuresEcoBasic,
    structuresEcoStorage: structuresEcoStorage,
    structuresFactories: structuresFactories,
    structuresIntel: structuresIntel,
    structuresIntelAdvanced: structuresIntelAdvanced,
    structuresIntelBasic: structuresIntelBasic,
    structuresSuperWeapons: structuresSuperWeapons,
    teleporters: teleporters,
    titans: titans,
    titansAmmo: titansAmmo,
    titansWeapons: titansWeapons,
    unitCannonMobile: unitCannonMobile,
    vehicles: vehicles,
    vehiclesAdvanced: vehiclesAdvanced,
    vehiclesAdvancedMobile: vehiclesAdvancedMobile,
    vehiclesAmmo: vehiclesAmmo,
    vehiclesBasic: vehiclesBasic,
    vehiclesBasicMobile: vehiclesBasicMobile,
    vehiclesMobile: vehiclesMobile,
    vehiclesWeapons: vehiclesWeapons,
    weapons: weapons,
    units: units,
    unitsNoCluster: unitsNoCluster,
  };
});
