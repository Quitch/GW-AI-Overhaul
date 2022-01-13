define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"], function (
  gwaioUnits
) {
  var airBasicMobile = [
    gwaioUnits.airFabber,
    gwaioUnits.bumblebee,
    gwaioUnits.firefly,
    gwaioUnits.hummingbird,
    gwaioUnits.icarus,
    gwaioUnits.pelican,
  ];
  var airAdvancedMobile = [
    gwaioUnits.airFabberAdvanced,
    gwaioUnits.angel,
    gwaioUnits.hornet,
    gwaioUnits.horsefly,
    gwaioUnits.kestrel,
    gwaioUnits.phoenix,
    gwaioUnits.wyrm,
  ];
  var airBasicAmmo = [
    gwaioUnits.bumblebeeAmmo,
    gwaioUnits.fireflyAmmo,
    gwaioUnits.hummingbirdAmmo,
    gwaioUnits.icarusAmmo,
  ];
  var airBasicWeapons = [
    gwaioUnits.bumblebeeWeapon,
    gwaioUnits.fireflyWeapon,
    gwaioUnits.hummingbirdWeapon,
    gwaioUnits.icarusWeapon,
  ];
  var airAdvancedAmmo = [
    gwaioUnits.angelAmmo,
    gwaioUnits.hornetAmmo,
    gwaioUnits.horseflyAmmo,
    gwaioUnits.kestrelAmmo,
    gwaioUnits.phoenixAmmo,
    gwaioUnits.wyrmAmmo,
  ];
  var airAdvancedWeapons = [
    gwaioUnits.angelBeam,
    gwaioUnits.hornetWeapon,
    gwaioUnits.horseflyWeapon,
    gwaioUnits.kestrelWeapon,
    gwaioUnits.phoenixWeapon,
    gwaioUnits.wyrmWeapon,
  ];
  var airBasic = airBasicMobile.concat(gwaioUnits.airFactory);
  var airAdvanced = airAdvancedMobile.concat(gwaioUnits.airFactoryAdvanced);
  var airAmmo = airBasicAmmo.concat(airAdvancedAmmo);
  var airWeapons = airBasicWeapons.concat(airAdvancedWeapons);
  var airMobile = airBasicMobile.concat(airAdvancedMobile);
  var air = airBasic.concat(airAdvanced);

  var botsBasicMobile = [
    gwaioUnits.boom,
    gwaioUnits.botFabber,
    gwaioUnits.dox,
    gwaioUnits.grenadier,
    gwaioUnits.spark,
    gwaioUnits.stinger,
    gwaioUnits.stitch,
  ];
  var botsBasicAmmo = [
    gwaioUnits.boomAmmo,
    gwaioUnits.doxAmmo,
    gwaioUnits.grenadierAmmo,
    gwaioUnits.sparkAmmo,
    gwaioUnits.stingerAmmo,
  ];
  var botsBasicWeapons = [
    gwaioUnits.boomWeapon,
    gwaioUnits.doxWeapon,
    gwaioUnits.grenadierWeapon,
    gwaioUnits.sparkWeapon,
    gwaioUnits.stingerWeapon,
  ];
  var botsAdvancedMobile = [
    gwaioUnits.bluehawk,
    gwaioUnits.botFabberAdvanced,
    gwaioUnits.colonel,
    gwaioUnits.gilE,
    gwaioUnits.locusts,
    gwaioUnits.mend,
    gwaioUnits.slammer,
  ];
  var botsAdvancedAmmo = [
    gwaioUnits.bluehawkAmmo,
    gwaioUnits.bluehawkBeamAmmo,
    gwaioUnits.colonelAmmo,
    gwaioUnits.gilEAmmo,
    gwaioUnits.gileEBeamAmmo,
    gwaioUnits.locustsAmmo,
    gwaioUnits.slammerAmmo,
    gwaioUnits.slammerTorpedoAmmo,
  ];
  var botsAdvancedWeapons = [
    gwaioUnits.bluehawkBeam,
    gwaioUnits.bluehawkWeapon,
    gwaioUnits.colonelWeapon,
    gwaioUnits.gileEBeam,
    gwaioUnits.gileEWeapon,
    gwaioUnits.locustsWeapon,
    gwaioUnits.slammerTorpedo,
    gwaioUnits.slammerWeapon,
  ];
  var botsBasic = botsBasicMobile.concat(gwaioUnits.botFactory);
  var botsAdvanced = botsAdvancedMobile.concat(gwaioUnits.botFactoryAdvanced);
  var botsAmmo = botsBasicAmmo.concat(botsAdvancedAmmo);
  var botsWeapons = botsBasicWeapons.concat(botsAdvancedWeapons);
  var botsMobile = botsBasicMobile.concat(botsAdvancedMobile);
  var bots = botsBasic.concat(botsAdvanced);

  var navalBasicMobile = [
    gwaioUnits.barnacle,
    gwaioUnits.barracuda,
    gwaioUnits.narwhal,
    gwaioUnits.navalFabber,
    gwaioUnits.orca,
    gwaioUnits.piranha,
  ];
  var navalBasicAmmo = [
    gwaioUnits.barracudaAmmo,
    gwaioUnits.narwhalAAAmmo,
    gwaioUnits.narwhalAmmo,
    gwaioUnits.narwhalTorpedoAmmo,
    gwaioUnits.orcaAmmo,
    gwaioUnits.orcaTorpedoAmmo,
    gwaioUnits.piranhaAmmo,
  ];
  var navalBasicWeapons = [
    gwaioUnits.barracudaWeapon,
    gwaioUnits.narwhalAA,
    gwaioUnits.narwhalTorpedo,
    gwaioUnits.narwhalWeapon,
    gwaioUnits.orcaTorpedo,
    gwaioUnits.orcaWeapon,
    gwaioUnits.piranhaWeapon,
  ];
  var navalAdvancedMobile = [
    gwaioUnits.kaiju,
    gwaioUnits.kraken,
    gwaioUnits.leviathan,
    gwaioUnits.navalFabberAdvanced,
    gwaioUnits.squall,
    gwaioUnits.stingray,
    gwaioUnits.typhoon,
  ];
  var navalAdvancedAmmo = [
    gwaioUnits.kaijuAmmo,
    gwaioUnits.kaijuSecondaryAmmo,
    gwaioUnits.krakenMissileAmmo,
    gwaioUnits.krakenWeaponAmmo,
    gwaioUnits.leviathanAmmo,
    gwaioUnits.squallAmmo,
    gwaioUnits.squallTorpedoAmmo,
    gwaioUnits.stingrayAAAmmo,
    gwaioUnits.stingrayAmmo,
    gwaioUnits.stingrayBeamAmmo,
    gwaioUnits.typhoonAmmo,
  ];
  var navalAdvancedWeapons = [
    gwaioUnits.kaijuSecondary,
    gwaioUnits.kaijuWeapon,
    gwaioUnits.krakenMissile,
    gwaioUnits.krakenWeapon,
    gwaioUnits.leviathanWeapon,
    gwaioUnits.squallTorpedo,
    gwaioUnits.squallWeapon,
    gwaioUnits.stingrayAA,
    gwaioUnits.stingrayBeam,
    gwaioUnits.stingrayWeapon,
    gwaioUnits.typhoonWeapon,
  ];
  var navalBasic = navalBasicMobile.concat(gwaioUnits.navalFactory);
  var navalAdvanced = navalAdvancedMobile.concat(
    gwaioUnits.navalFactoryAdvanced
  );
  var navalAmmo = navalBasicAmmo.concat(navalAdvancedAmmo);
  var navalWeapons = navalBasicWeapons.concat(navalAdvancedWeapons);
  var navalMobile = navalBasicMobile.concat(navalAdvancedMobile);
  var naval = navalBasic.concat(navalAdvanced);

  var orbitalBasicMobile = [
    gwaioUnits.arkyd,
    gwaioUnits.astraeus,
    gwaioUnits.avenger,
    gwaioUnits.hermes,
    gwaioUnits.orbitalFabber,
  ];
  var orbitalBasicAmmo = [gwaioUnits.avengerAmmo];
  var orbitalBasicWeapons = [gwaioUnits.avengerWeapon];
  var orbitalAdvancedMobile = [
    gwaioUnits.artemis,
    gwaioUnits.omega,
    gwaioUnits.radarSatelliteAdvanced,
    gwaioUnits.solarArray,
    gwaioUnits.sxx,
  ];
  var orbitalAdvancedAmmo = [
    gwaioUnits.artemisAmmo,
    gwaioUnits.omegaAmmo,
    gwaioUnits.omegaAmmoAG,
    gwaioUnits.sxxAmmo,
  ];
  var orbitalAdvancedWeapons = [
    gwaioUnits.artemisWeapon,
    gwaioUnits.omegaWeapon,
    gwaioUnits.omegaWeaponAG,
    gwaioUnits.sxxWeapon,
  ];
  var orbitalBasic = orbitalBasicMobile.concat(gwaioUnits.orbitalLauncher);
  var orbitalAdvanced = orbitalAdvancedMobile.concat(gwaioUnits.orbitalFactory);
  var orbitalAmmo = orbitalBasicAmmo.concat(orbitalAdvancedAmmo);
  var orbitalWeapons = orbitalBasicWeapons.concat(orbitalAdvancedWeapons);
  var orbitalMobile = orbitalBasicMobile.concat(orbitalAdvancedMobile);
  var orbital = orbitalBasic.concat(orbitalAdvanced);

  var structuresArtilleryBasic = [gwaioUnits.lob, gwaioUnits.pelter];
  var structuresArtilleryBasicAmmo = [
    gwaioUnits.lobAmmo,
    gwaioUnits.pelterAmmo,
  ];
  var structuresArtilleryBasicWeapon = [
    gwaioUnits.lobWeapon,
    gwaioUnits.pelterWeapon,
  ];
  var structuresArtilleryAdvanced = [gwaioUnits.holkins];
  var structuresArtilleryAdvancedAmmo = [gwaioUnits.holkinsAmmo];
  var structuresArtilleryAdvancedWeapons = [gwaioUnits.holkinsWeapon];
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
    gwaioUnits.anchor,
    gwaioUnits.galata,
    gwaioUnits.landMine,
    gwaioUnits.laserDefenseTower,
    gwaioUnits.singleLaserDefenseTower,
    gwaioUnits.torpedoLauncher,
    gwaioUnits.umbrella,
    gwaioUnits.wall,
  ];
  var structuresDefencesBasicAmmo = [
    gwaioUnits.anchorAmmoAG,
    gwaioUnits.anchorAmmoAO,
    gwaioUnits.galataAmmo,
    gwaioUnits.LandMineAmmo,
    gwaioUnits.laserDefenseTowerAmmo,
    gwaioUnits.singleLaserDefenseTowerAmmo,
    gwaioUnits.torpedoLauncherAmmo,
    gwaioUnits.torpedoLauncherLandAmmo,
    gwaioUnits.torpedoLauncherWaterAmmo,
    gwaioUnits.umbrellaAmmo,
    gwaioUnits.umbrellaBeam,
  ];
  var structuresDefencesBasicWeapons = [
    gwaioUnits.anchorWeaponAG,
    gwaioUnits.anchorWeaponAO,
    gwaioUnits.galataWeapon,
    gwaioUnits.landMineWeapon,
    gwaioUnits.laserDefenseTowerWeapon,
    gwaioUnits.singleLaserDefenseTowerWeapon,
    gwaioUnits.torpedoLauncherWeapon,
    gwaioUnits.umbrellaBeam,
    gwaioUnits.umbrellaWeapon,
  ];
  var structuresDefencesAdvanced = [
    gwaioUnits.catapult,
    gwaioUnits.flak,
    gwaioUnits.laserDefenseTowerAdvanced,
    gwaioUnits.torpedoLauncherAdvanced,
    gwaioUnits.antiNukeLauncher,
  ];
  var structuresDefencesAdvancedAmmo = [
    gwaioUnits.catapultAmmo,
    gwaioUnits.catapultBeamAmmo,
    gwaioUnits.flakAmmo,
    gwaioUnits.laserDefenseTowerAdvancedAmmo,
    gwaioUnits.torpedoLauncherAdvancedAmmo,
    gwaioUnits.torpedoLauncherAdvancedLandAmmo,
    gwaioUnits.torpedoLauncherAdvancedWaterAmmo,
  ];
  var structuresDefencesAdvancedWeapons = [
    gwaioUnits.catapultBeam,
    gwaioUnits.catapultWeapon,
    gwaioUnits.flakWeapon,
    gwaioUnits.laserDefenseTowerAdvancedWeapon,
    gwaioUnits.torpedoLauncherAdvancedWeapon,
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
  var structuresEcoBasic = [gwaioUnits.energyPlant, gwaioUnits.metalExtractor];
  var structuresEcoAdvanced = [
    gwaioUnits.energyPlantAdvanced,
    gwaioUnits.jig,
    gwaioUnits.metalExtractorAdvanced,
  ];
  var structuresEcoStorage = [
    gwaioUnits.energyStorage,
    gwaioUnits.metalStorage,
  ];
  var structuresEco = structuresEcoBasic.concat(
    structuresEcoAdvanced,
    structuresEcoStorage
  );
  var structuresFactories = [
    gwaioUnits.airFactory,
    gwaioUnits.airFactoryAdvanced,
    gwaioUnits.botFactory,
    gwaioUnits.botFactoryAdvanced,
    gwaioUnits.navalFactory,
    gwaioUnits.navalFactoryAdvanced,
    gwaioUnits.orbitalFactory,
    gwaioUnits.orbitalLauncher,
    gwaioUnits.unitCannon,
    gwaioUnits.vehicleFactory,
    gwaioUnits.vehicleFactoryAdvanced,
  ];
  var structuresIntelBasic = [gwaioUnits.radar, gwaioUnits.teleporter];
  var structuresIntelAdvanced = [
    gwaioUnits.deepSpaceOrbitalRadar,
    gwaioUnits.radarAdvanced,
  ];
  var structuresIntel = structuresIntelBasic.concat(structuresIntelAdvanced);
  var structuresSuperWeapons = [
    gwaioUnits.catalyst,
    gwaioUnits.halley,
    gwaioUnits.nukeLauncher,
  ];
  var structures = structuresFactories.concat(
    structuresDefences,
    structuresSuperWeapons,
    structuresIntel,
    structuresEco,
    structuresArtillery
  );

  var titans = [
    gwaioUnits.ares,
    gwaioUnits.atlas,
    gwaioUnits.helios,
    gwaioUnits.ragnarok,
    gwaioUnits.zeus,
  ];
  var titansAmmo = [
    gwaioUnits.aresAmmo,
    gwaioUnits.aresSecondaryAmmo,
    gwaioUnits.aresStompAmmo,
    gwaioUnits.atlasAmmo,
    gwaioUnits.heliosAmmo,
    gwaioUnits.zeusAmmo,
  ];
  var titansWeapons = [
    gwaioUnits.aresSecondary,
    gwaioUnits.aresStomp,
    gwaioUnits.aresWeapon,
    gwaioUnits.atlasWeapon,
    gwaioUnits.heliosWeapon,
    gwaioUnits.zeusWeapon,
  ];

  var vehiclesBasicMobile = [
    gwaioUnits.ant,
    gwaioUnits.drifter,
    gwaioUnits.inferno,
    gwaioUnits.skitter,
    gwaioUnits.spinner,
    gwaioUnits.stryker,
    gwaioUnits.vehicleFabber,
  ];
  var vehiclesBasicAmmo = [
    gwaioUnits.antAmmo,
    gwaioUnits.drifterAmmo,
    gwaioUnits.infernoAmmo,
    gwaioUnits.skitterAmmo,
    gwaioUnits.spinnerAmmo,
    gwaioUnits.strykerAmmo,
  ];
  var vehiclesBasicWeapons = [
    gwaioUnits.antWeapon,
    gwaioUnits.drifterWeapon,
    gwaioUnits.infernoWeapon,
    gwaioUnits.skitterWeapon,
    gwaioUnits.spinnerWeapon,
    gwaioUnits.strykerWeapon,
  ];
  var vehiclesAdvancedMobile = [
    gwaioUnits.leveler,
    gwaioUnits.manhattan,
    gwaioUnits.sheller,
    gwaioUnits.storm,
    gwaioUnits.vanguard,
    gwaioUnits.vehicleFabberAdvanced,
  ];
  var vehiclesAdvancedAmmo = [
    gwaioUnits.levelerAmmo,
    gwaioUnits.shellerAmmo,
    gwaioUnits.stormAmmo,
    gwaioUnits.vanguardAmmo,
  ];
  var vehiclesAdvancedWeapons = [
    gwaioUnits.levelerWeapon,
    gwaioUnits.manhattanWeapon,
    gwaioUnits.shellerWeapon,
    gwaioUnits.stormWeapon,
    gwaioUnits.vanguardWeapon,
  ];
  var vehiclesBasic = vehiclesBasicMobile.concat(gwaioUnits.vehicleFactory);
  var vehiclesAdvanced = vehiclesAdvancedMobile.concat(
    gwaioUnits.vehicleFactoryAdvanced
  );
  var vehiclesAmmo = vehiclesBasicAmmo.concat(vehiclesAdvancedAmmo);
  var vehiclesWeapons = vehiclesBasicWeapons.concat(vehiclesAdvancedWeapons);
  var vehiclesMobile = vehiclesBasicMobile.concat(vehiclesAdvancedMobile);
  var vehicles = vehiclesBasic.concat(vehiclesAdvanced);

  var unitCannonMobile = [
    gwaioUnits.ant,
    gwaioUnits.boom,
    gwaioUnits.dox,
    gwaioUnits.grenadier,
    gwaioUnits.spark,
    gwaioUnits.spinner,
    gwaioUnits.stinger,
    gwaioUnits.stitch,
    gwaioUnits.storm,
    gwaioUnits.stryker,
  ];

  var fabbersBasic = [
    gwaioUnits.airFabber,
    gwaioUnits.botFabber,
    gwaioUnits.navalFabber,
    gwaioUnits.orbitalFabber,
    gwaioUnits.vehicleFabber,
    gwaioUnits.stitch,
    gwaioUnits.barnacle,
  ];
  var fabbersAdvanced = [
    gwaioUnits.airFabberAdvanced,
    gwaioUnits.botFabberAdvanced,
    gwaioUnits.navalFabberAdvanced,
    gwaioUnits.vehicleFabberAdvanced,
    gwaioUnits.mend,
  ];
  var fabbers = fabbersBasic.concat(fabbersAdvanced);

  // exclude orbital factories due to their fabber working differently
  var factoriesBasic = [
    (gwaioUnits.airFactory,
    gwaioUnits.botFactory,
    gwaioUnits.navalFactory,
    gwaioUnits.vehicleFactory),
  ];
  var factoriesAdvanced = [
    (gwaioUnits.airFactoryAdvanced,
    gwaioUnits.botFactoryAdvanced,
    gwaioUnits.navalFactoryAdvanced,
    gwaioUnits.vehicleFactoryAdvanced),
  ];
  // add orbital factories too
  var factories = factoriesBasic.concat(
    factoriesAdvanced,
    gwaioUnits.orbitalLauncher,
    gwaioUnits.orbitalFactory
  );

  var mobile = airMobile.concat(
    botsMobile,
    navalMobile,
    orbitalMobile,
    vehiclesMobile,
    gwaioUnits.atlas,
    gwaioUnits.ares,
    gwaioUnits.zeus
  );
  var notMobile = structures.concat(gwaioUnits.ragnarok);

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

  // units all T2 fabbers have access to immediately
  var starterUnitsAdvanced = structuresSuperWeapons.concat(
    gwaioUnits.radarAdvanced,
    gwaioUnits.unitCannon,
    gwaioUnits.antiNukeLauncher
  );

  return {
    air: air,
    airAdvanced: airAdvanced,
    airAdvancedMobile: airAdvancedMobile,
    airAmmo: airAmmo,
    airBasic: airBasic,
    airBasicMobile: airBasicMobile,
    airMobile: airMobile,
    airWeapons: airWeapons,
    ammo: ammo,
    bots: bots,
    botsAdvanced: botsAdvanced,
    botsAdvancedMobile: botsAdvancedMobile,
    botsAmmo: botsAmmo,
    botsBasic: botsBasic,
    botsBasicMobile: botsBasicMobile,
    botsMobile: botsMobile,
    botsWeapons: botsWeapons,
    fabbers: fabbers,
    fabbersAdvanced: fabbersAdvanced,
    fabbersBasic: fabbersBasic,
    factories: factories,
    factoriesAdvanced: factoriesAdvanced,
    factoriesBasic: factoriesBasic,
    mobile: mobile,
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
    structuresFactories: structuresFactories,
    structuresIntel: structuresIntel,
    structuresIntelAdvanced: structuresIntelAdvanced,
    structuresIntelBasic: structuresIntelBasic,
    structuresSuperWeapons: structuresSuperWeapons,
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
  };
});
