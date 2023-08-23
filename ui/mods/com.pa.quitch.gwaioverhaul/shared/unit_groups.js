define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"], function (
  gwoUnit
) {
  var airBasicMobile = [
    gwoUnit.airFabber,
    gwoUnit.bumblebee,
    gwoUnit.firefly,
    gwoUnit.hummingbird,
    gwoUnit.icarus,
    gwoUnit.pelican,
  ];
  var airAdvancedMobile = [
    gwoUnit.airFabberAdvanced,
    gwoUnit.angel,
    gwoUnit.hornet,
    gwoUnit.horsefly,
    gwoUnit.kestrel,
    gwoUnit.phoenix,
    gwoUnit.wyrm,
  ];
  var airBasicAmmo = [
    gwoUnit.bumblebeeAmmo,
    gwoUnit.fireflyAmmo,
    gwoUnit.hummingbirdAmmo,
    gwoUnit.icarusAmmo,
  ];
  var airBasicWeapons = [
    gwoUnit.bumblebeeWeapon,
    gwoUnit.fireflyWeapon,
    gwoUnit.hummingbirdWeapon,
    gwoUnit.icarusWeapon,
  ];
  var airAdvancedAmmo = [
    gwoUnit.angelAmmo,
    gwoUnit.hornetAmmo,
    gwoUnit.horseflyAmmo,
    gwoUnit.kestrelAmmo,
    gwoUnit.phoenixAmmo,
    gwoUnit.wyrmAmmo,
  ];
  var airAdvancedWeapons = [
    gwoUnit.hornetWeapon,
    gwoUnit.horseflyWeapon,
    gwoUnit.kestrelWeapon,
    gwoUnit.phoenixWeapon,
    gwoUnit.wyrmWeapon,
  ];
  var airBasic = airBasicMobile.concat(gwoUnit.airFactory);
  var airAdvanced = airAdvancedMobile.concat(gwoUnit.airFactoryAdvanced);
  var airAmmo = airBasicAmmo.concat(airAdvancedAmmo);
  var airWeapons = airBasicWeapons.concat(airAdvancedWeapons);
  var airMobile = airBasicMobile.concat(airAdvancedMobile);
  var airMobileNoCluster = _.filter(airMobile, function (unit) {
    return unit !== gwoUnit.angel;
  });
  var air = airBasic.concat(airAdvanced);

  var botsBasicMobile = [
    gwoUnit.boom,
    gwoUnit.botFabber,
    gwoUnit.dox,
    gwoUnit.grenadier,
    gwoUnit.spark,
    gwoUnit.stinger,
    gwoUnit.stitch,
  ];
  var botsBasicAmmo = [
    gwoUnit.boomAmmo,
    gwoUnit.doxAmmo,
    gwoUnit.grenadierAmmo,
    gwoUnit.sparkAmmo,
    gwoUnit.stingerAmmo,
  ];
  var botsBasicWeapons = [
    gwoUnit.boomWeapon,
    gwoUnit.doxWeapon,
    gwoUnit.grenadierWeapon,
    gwoUnit.sparkWeapon,
    gwoUnit.stingerWeapon,
  ];
  var botsAdvancedMobile = [
    gwoUnit.bluehawk,
    gwoUnit.botFabberAdvanced,
    gwoUnit.colonel,
    gwoUnit.gilE,
    gwoUnit.locusts,
    gwoUnit.mend,
    gwoUnit.slammer,
  ];
  var botsAdvancedAmmo = [
    gwoUnit.bluehawkAmmo,
    gwoUnit.colonelAmmo,
    gwoUnit.gilEAmmo,
    gwoUnit.locustsAmmo,
    gwoUnit.slammerAmmo,
    gwoUnit.slammerTorpedoAmmo,
  ];
  var botsAdvancedWeapons = [
    gwoUnit.bluehawkWeapon,
    gwoUnit.colonelWeapon,
    gwoUnit.gileEWeapon,
    gwoUnit.locustsWeapon,
    gwoUnit.slammerTorpedo,
    gwoUnit.slammerWeapon,
  ];
  var botsBasic = botsBasicMobile.concat(gwoUnit.botFactory);
  var botsAdvanced = botsAdvancedMobile.concat(gwoUnit.botFactoryAdvanced);
  var botsAmmo = botsBasicAmmo.concat(botsAdvancedAmmo);
  var botsWeapons = botsBasicWeapons.concat(botsAdvancedWeapons);
  var botsMobile = botsBasicMobile.concat(botsAdvancedMobile);
  var botsMobileNoCluster = _.filter(botsMobile, function (unit) {
    return unit !== gwoUnit.colonel;
  });
  var bots = botsBasic.concat(botsAdvanced);

  var navalBasicMobile = [
    gwoUnit.barnacle,
    gwoUnit.barracuda,
    gwoUnit.narwhal,
    gwoUnit.navalFabber,
    gwoUnit.orca,
    gwoUnit.piranha,
  ];
  var navalBasicAmmo = [
    gwoUnit.barracudaAmmo,
    gwoUnit.narwhalAAAmmo,
    gwoUnit.narwhalAmmo,
    gwoUnit.narwhalTorpedoAmmo,
    gwoUnit.orcaAmmo,
    gwoUnit.orcaTorpedoAmmo,
    gwoUnit.piranhaAmmo,
  ];
  var navalBasicWeapons = [
    gwoUnit.barracudaWeapon,
    gwoUnit.narwhalAA,
    gwoUnit.narwhalTorpedo,
    gwoUnit.narwhalWeapon,
    gwoUnit.orcaTorpedo,
    gwoUnit.orcaWeapon,
    gwoUnit.piranhaWeapon,
  ];
  var navalAdvancedMobile = [
    gwoUnit.kaiju,
    gwoUnit.kraken,
    gwoUnit.leviathan,
    gwoUnit.navalFabberAdvanced,
    gwoUnit.squall,
    gwoUnit.stingray,
    gwoUnit.typhoon,
  ];
  var navalAdvancedAmmo = [
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
  var navalAdvancedWeapons = [
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
  var navalBasic = navalBasicMobile.concat(gwoUnit.navalFactory);
  var navalAdvanced = navalAdvancedMobile.concat(gwoUnit.navalFactoryAdvanced);
  var navalAmmo = navalBasicAmmo.concat(navalAdvancedAmmo);
  var navalWeapons = navalBasicWeapons.concat(navalAdvancedWeapons);
  var navalMobile = navalBasicMobile.concat(navalAdvancedMobile);
  var naval = navalBasic.concat(navalAdvanced);

  var orbitalBasicMobile = [
    gwoUnit.arkyd,
    gwoUnit.astraeus,
    gwoUnit.avenger,
    gwoUnit.hermes,
    gwoUnit.orbitalFabber,
  ];
  var orbitalBasicAmmo = [gwoUnit.avengerAmmo];
  var orbitalBasicWeapons = [gwoUnit.avengerWeapon];
  var orbitalAdvancedMobile = [
    gwoUnit.artemis,
    gwoUnit.omega,
    gwoUnit.radarSatelliteAdvanced,
    gwoUnit.solarArray,
    gwoUnit.sxx,
  ];
  var orbitalAdvancedAmmo = [
    gwoUnit.artemisAmmo,
    gwoUnit.omegaAmmo,
    gwoUnit.omegaAmmoAG,
    gwoUnit.sxxAmmo,
  ];
  var orbitalAdvancedWeapons = [
    gwoUnit.artemisWeapon,
    gwoUnit.omegaWeapon,
    gwoUnit.omegaWeaponAG,
    gwoUnit.sxxWeapon,
  ];
  var orbitalBasic = orbitalBasicMobile.concat(gwoUnit.orbitalLauncher);
  var orbitalAdvanced = orbitalAdvancedMobile.concat(
    gwoUnit.orbitalFactory,
    gwoUnit.jig // this is how GW treats it
  );
  var orbitalAmmo = orbitalBasicAmmo.concat(orbitalAdvancedAmmo);
  var orbitalWeapons = orbitalBasicWeapons.concat(orbitalAdvancedWeapons);
  var orbitalMobile = orbitalBasicMobile.concat(orbitalAdvancedMobile);
  var orbital = orbitalBasic.concat(orbitalAdvanced);

  var structuresArtilleryBasic = [gwoUnit.lob, gwoUnit.pelter];
  var structuresArtilleryBasicAmmo = [gwoUnit.lobAmmo, gwoUnit.pelterAmmo];
  var structuresArtilleryBasicWeapon = [
    gwoUnit.lobWeapon,
    gwoUnit.pelterWeapon,
  ];
  var structuresArtilleryAdvanced = [gwoUnit.holkins];
  var structuresArtilleryAdvancedAmmo = [gwoUnit.holkinsAmmo];
  var structuresArtilleryAdvancedWeapons = [gwoUnit.holkinsWeapon];
  var structuresArtillery = structuresArtilleryBasic.concat(
    structuresArtilleryAdvanced
  );
  var structuresArtilleryAmmo = structuresArtilleryBasicAmmo.concat(
    structuresArtilleryAdvancedAmmo
  );
  var structuresArtilleryWeapons = structuresArtilleryBasicWeapon.concat(
    structuresArtilleryAdvancedWeapons
  );

  var structuresDefencesBasic = [
    gwoUnit.anchor,
    gwoUnit.galata,
    gwoUnit.landMine,
    gwoUnit.laserDefenseTower,
    gwoUnit.singleLaserDefenseTower,
    gwoUnit.torpedoLauncher,
    gwoUnit.umbrella,
    gwoUnit.wall,
  ];
  var structuresDefencesBasicAmmo = [
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
  var structuresDefencesBasicWeapons = [
    gwoUnit.anchorWeaponAG,
    gwoUnit.anchorWeaponAO,
    gwoUnit.galataWeapon,
    gwoUnit.landMineWeapon,
    gwoUnit.laserDefenseTowerWeapon,
    gwoUnit.singleLaserDefenseTowerWeapon,
    gwoUnit.torpedoLauncherWeapon,
    gwoUnit.umbrellaWeapon,
  ];
  var structuresDefencesAdvanced = [
    gwoUnit.catapult,
    gwoUnit.flak,
    gwoUnit.laserDefenseTowerAdvanced,
    gwoUnit.torpedoLauncherAdvanced,
    gwoUnit.antiNukeLauncher,
  ];
  var structuresDefencesAdvancedAmmo = [
    gwoUnit.catapultAmmo,
    gwoUnit.flakAmmo,
    gwoUnit.laserDefenseTowerAdvancedAmmo,
    gwoUnit.torpedoLauncherAdvancedLandAmmo,
    gwoUnit.torpedoLauncherAdvancedWaterAmmo,
  ];
  var structuresDefencesAdvancedWeapons = [
    gwoUnit.catapultWeapon,
    gwoUnit.flakWeapon,
    gwoUnit.laserDefenseTowerAdvancedWeapon,
    gwoUnit.torpedoLauncherAdvancedWeapon,
  ];
  var structuresDefencesAmmo = structuresDefencesBasicAmmo.concat(
    structuresDefencesAdvancedAmmo
  );
  var structuresDefencesWeapons = structuresDefencesBasicWeapons.concat(
    structuresDefencesAdvancedWeapons
  );
  var structuresDefences = structuresDefencesBasic.concat(
    structuresDefencesAdvanced
  );
  var structuresEcoBasic = [gwoUnit.energyPlant, gwoUnit.metalExtractor];
  var structuresEcoAdvanced = [
    gwoUnit.energyPlantAdvanced,
    gwoUnit.jig,
    gwoUnit.metalExtractorAdvanced,
  ];
  var structuresEcoStorage = [gwoUnit.energyStorage, gwoUnit.metalStorage];
  var structuresEco = structuresEcoBasic.concat(
    structuresEcoAdvanced,
    structuresEcoStorage
  );
  var structuresFactories = [
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
  var structuresIntelBasic = [gwoUnit.radar];
  var structuresIntelAdvanced = [
    gwoUnit.deepSpaceOrbitalRadar,
    gwoUnit.radarAdvanced,
  ];
  var structuresIntel = structuresIntelBasic.concat(structuresIntelAdvanced);
  var structuresSuperWeapons = [
    gwoUnit.catalyst,
    gwoUnit.halley,
    gwoUnit.nukeLauncher,
  ];
  var structures = structuresFactories.concat(
    structuresDefences,
    structuresSuperWeapons,
    structuresIntel,
    structuresEco,
    structuresArtillery,
    gwoUnit.teleporter
  );

  var titans = [
    gwoUnit.ares,
    gwoUnit.atlas,
    gwoUnit.helios,
    gwoUnit.ragnarok,
    gwoUnit.zeus,
  ];
  var titansAmmo = [
    gwoUnit.aresAmmo,
    gwoUnit.aresSecondaryAmmo,
    gwoUnit.atlasAmmo,
    gwoUnit.heliosAmmo,
    gwoUnit.zeusAmmo,
  ];
  var titansWeapons = [
    gwoUnit.aresSecondary,
    gwoUnit.aresWeapon,
    gwoUnit.atlasWeapon,
    gwoUnit.heliosWeapon,
    gwoUnit.zeusWeapon,
  ];

  var vehiclesBasicMobile = [
    gwoUnit.ant,
    gwoUnit.drifter,
    gwoUnit.inferno,
    gwoUnit.skitter,
    gwoUnit.spinner,
    gwoUnit.stryker,
    gwoUnit.vehicleFabber,
  ];
  var vehiclesBasicAmmo = [
    gwoUnit.antAmmo,
    gwoUnit.drifterAmmo,
    gwoUnit.infernoAmmo,
    gwoUnit.skitterAmmo,
    gwoUnit.spinnerAmmo,
    gwoUnit.strykerAmmo,
  ];
  var vehiclesBasicWeapons = [
    gwoUnit.antWeapon,
    gwoUnit.drifterWeapon,
    gwoUnit.infernoWeapon,
    gwoUnit.skitterWeapon,
    gwoUnit.spinnerWeapon,
    gwoUnit.strykerWeapon,
  ];
  var vehiclesAdvancedMobile = [
    gwoUnit.leveler,
    gwoUnit.manhattan,
    gwoUnit.sheller,
    gwoUnit.storm,
    gwoUnit.vanguard,
    gwoUnit.vehicleFabberAdvanced,
  ];
  var vehiclesAdvancedAmmo = [
    gwoUnit.levelerAmmo,
    gwoUnit.shellerAmmo,
    gwoUnit.stormAmmo,
    gwoUnit.vanguardAmmo,
  ];
  var vehiclesAdvancedWeapons = [
    gwoUnit.levelerWeapon,
    gwoUnit.manhattanWeapon,
    gwoUnit.shellerWeapon,
    gwoUnit.stormWeapon,
    gwoUnit.vanguardWeapon,
  ];
  var vehiclesBasic = vehiclesBasicMobile.concat(gwoUnit.vehicleFactory);
  var vehiclesAdvanced = vehiclesAdvancedMobile.concat(
    gwoUnit.vehicleFactoryAdvanced
  );
  var vehiclesAmmo = vehiclesBasicAmmo.concat(vehiclesAdvancedAmmo);
  var vehiclesWeapons = vehiclesBasicWeapons.concat(vehiclesAdvancedWeapons);
  var vehiclesMobile = vehiclesBasicMobile.concat(vehiclesAdvancedMobile);
  var vehicles = vehiclesBasic.concat(vehiclesAdvanced);

  var unitCannonMobile = [
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

  var fabbersBasic = [
    gwoUnit.airFabber,
    gwoUnit.barnacle,
    gwoUnit.botFabber,
    gwoUnit.navalFabber,
    gwoUnit.orbitalFabber,
    gwoUnit.stitch,
    gwoUnit.vehicleFabber,
  ];
  var fabbersAdvanced = [
    gwoUnit.airFabberAdvanced,
    gwoUnit.angel,
    gwoUnit.botFabberAdvanced,
    gwoUnit.colonel,
    gwoUnit.mend,
    gwoUnit.navalFabberAdvanced,
    gwoUnit.vehicleFabberAdvanced,
  ];
  var fabbers = fabbersBasic.concat(fabbersAdvanced);

  // exclude orbital factories due to their fabber working differently
  var factoriesBasic = [
    gwoUnit.airFactory,
    gwoUnit.botFactory,
    gwoUnit.navalFactory,
    gwoUnit.vehicleFactory,
  ];
  var factoriesAdvanced = [
    gwoUnit.airFactoryAdvanced,
    gwoUnit.botFactoryAdvanced,
    gwoUnit.navalFactoryAdvanced,
    gwoUnit.vehicleFactoryAdvanced,
  ];
  var factories = factoriesBasic.concat(
    factoriesAdvanced,
    gwoUnit.antiNukeLauncher,
    gwoUnit.orbitalFactory,
    gwoUnit.orbitalLauncher,
    gwoUnit.unitCannon
  );

  var mobile = airMobile.concat(
    botsMobile,
    navalMobile,
    orbitalMobile,
    vehiclesMobile,
    gwoUnit.atlas,
    gwoUnit.ares,
    gwoUnit.zeus
  );
  var notMobile = structures.concat(gwoUnit.ragnarok);
  var mobileNoCluster = airMobileNoCluster.concat(
    botsMobileNoCluster,
    navalMobile,
    orbitalMobile,
    vehiclesMobile,
    gwoUnit.atlas,
    gwoUnit.ares,
    gwoUnit.zeus
  );

  var energyIntel = structuresIntel.concat(
    gwoUnit.arkyd,
    gwoUnit.radarSatelliteAdvanced
  );
  var energyUnits = [
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
  var energyAll = energyIntel.concat(energyUnits);
  var energyWeapons = [
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

  var teleporters = [gwoUnit.teleporter, gwoUnit.helios];

  var ammo = airAmmo.concat(
    botsAmmo,
    navalAmmo,
    orbitalAmmo,
    structuresDefencesAmmo,
    titansAmmo,
    vehiclesAmmo
  );

  var weapons = airWeapons.concat(
    botsWeapons,
    navalWeapons,
    orbitalWeapons,
    structuresDefencesWeapons,
    titansWeapons,
    vehiclesWeapons
  );

  var units = mobile.concat(notMobile);
  var unitsNoCluster = mobileNoCluster.concat(mobile);

  var clusterCommanders = [gwoUnit.angel, gwoUnit.colonel];

  // units all T2 fabbers have access to immediately
  var starterUnitsAdvanced = structuresSuperWeapons.concat(
    gwoUnit.antiNukeLauncher,
    gwoUnit.energyPlantAdvanced,
    gwoUnit.metalExtractorAdvanced,
    gwoUnit.radarAdvanced,
    gwoUnit.unitCannon
  );

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
    energyIntel: energyIntel,
    energyUnits: energyUnits,
    energyAll: energyAll,
    energyWeapons: energyWeapons,
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
    notMobile: notMobile,
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
