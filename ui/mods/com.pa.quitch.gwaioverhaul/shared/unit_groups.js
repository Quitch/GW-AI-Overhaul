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
  var airBasic = airBasicMobile.concat(gwaioUnits.airFactory);
  var airAdvanced = airAdvancedMobile.concat(gwaioUnits.airFactoryAdvanced);
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
  var botsAdvancedMobile = [
    gwaioUnits.bluehawk,
    gwaioUnits.botFabberAdvanced,
    gwaioUnits.colonel,
    gwaioUnits.gilE,
    gwaioUnits.locusts,
    gwaioUnits.mend,
    gwaioUnits.slammer,
  ];
  var botsBasic = botsBasicMobile.concat(gwaioUnits.botFactory);
  var botsAdvanced = botsAdvancedMobile.concat(gwaioUnits.botFactoryAdvanced);
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
  var navalAdvancedMobile = [
    gwaioUnits.kaiju,
    gwaioUnits.kraken,
    gwaioUnits.leviathan,
    gwaioUnits.navalFabberAdvanced,
    gwaioUnits.squall,
    gwaioUnits.stingray,
    gwaioUnits.typhoon,
  ];
  var navalBasic = navalBasicMobile.concat(gwaioUnits.navalFactory);
  var navalAdvanced = navalAdvancedMobile.concat(
    gwaioUnits.navalFactoryAdvanced
  );
  var navalMobile = navalBasicMobile.concat(navalAdvancedMobile);
  var naval = navalBasic.concat(navalAdvanced);

  var orbitalBasicMobile = [
    gwaioUnits.arkyd,
    gwaioUnits.astraeus,
    gwaioUnits.avenger,
    gwaioUnits.hermes,
    gwaioUnits.orbitalFabber,
  ];
  var orbitalAdvancedMobile = [
    gwaioUnits.artemis,
    gwaioUnits.omega,
    gwaioUnits.radarSatelliteAdvanced,
    gwaioUnits.solarArray,
    gwaioUnits.sxx,
  ];
  var orbitalBasic = orbitalBasicMobile.concat(gwaioUnits.orbitalLauncher);
  var orbitalAdvanced = orbitalAdvancedMobile.concat(gwaioUnits.orbitalFactory);
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
  var structuresDefencesAdvanced = [
    gwaioUnits.catapult,
    gwaioUnits.flak,
    gwaioUnits.laserDefenseTowerAdvanced,
    gwaioUnits.torpedoLauncherAdvanced,
  ];
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

  var structuresIntelligence = [
    gwaioUnits.deepSpaceOrbitalRadar,
    gwaioUnits.radar,
    gwaioUnits.radarAdvanced,
    gwaioUnits.teleporter,
  ];

  var structuresSuperWeapons = [
    gwaioUnits.antiNukeLauncher,
    gwaioUnits.catalyst,
    gwaioUnits.halley,
    gwaioUnits.nukeLauncher,
  ];

  var structures = [
    structuresFactories,
    structuresDefences,
    structuresSuperWeapons,
    structuresIntelligence,
    structuresEco,
    structuresArtillery,
  ];

  var titans = [
    gwaioUnits.ares,
    gwaioUnits.atlas,
    gwaioUnits.helios,
    gwaioUnits.ragnarok,
    gwaioUnits.zeus,
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
  var vehiclesAdvancedMobile = [
    gwaioUnits.leveler,
    gwaioUnits.manhattan,
    gwaioUnits.sheller,
    gwaioUnits.storm,
    gwaioUnits.vanguard,
    gwaioUnits.vehicleFabberAdvanced,
  ];
  var vehiclesBasic = vehiclesBasicMobile.concat(gwaioUnits.vehicleFactory);
  var vehiclesAdvanced = vehiclesAdvancedMobile.concat(
    gwaioUnits.vehicleFactoryAdvanced
  );
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
  ];
  var fabbersAdvanced = [
    gwaioUnits.airFabberAdvanced,
    gwaioUnits.botFabberAdvanced,
    gwaioUnits.navalFabberAdvanced,
    gwaioUnits.vehicleFabberAdvanced,
  ];
  var fabbers = fabbersBasic.concat(fabbersAdvanced);

  var starterUnits = structuresEcoBasic.concat(
    structuresDefencesBasic,
    navalBasic,
    orbitalBasic
  );

  return {
    air: air,
    airAdvanced: airAdvanced,
    airBasic: airBasic,
    airMobile: airMobile,
    bots: bots,
    botsAdvanced: botsAdvanced,
    botsBasic: botsBasic,
    botsBasicMobile: botsBasicMobile,
    botsAdvancedMobile: botsAdvancedMobile,
    botsMobile: botsMobile,
    fabbers: fabbers,
    fabbersAdvanced: fabbersAdvanced,
    fabbersBasic: fabbersBasic,
    naval: naval,
    navalAdvanced: navalAdvanced,
    navalBasic: navalBasic,
    navalBasicMobile: navalBasicMobile,
    navalAdvancedMobile: navalAdvancedMobile,
    navalMobile: navalMobile,
    orbital: orbital,
    orbitalAdvanced: orbitalAdvanced,
    orbitalBasic: orbitalBasic,
    orbitalBasicMobile: orbitalBasicMobile,
    orbitalAdvancedMobile: orbitalAdvancedMobile,
    orbitalMobile: orbitalMobile,
    starterUnits: starterUnits,
    structures: structures,
    structuresArtillery: structuresArtillery,
    structuresArtilleryAmmo: structuresArtilleryAmmo,
    structuresArtilleryWeapons: structuresArtilleryWeapons,
    structuresDefences: structuresDefences,
    structuresEco: structuresEco,
    structuresFactories: structuresFactories,
    structuresIntelligence: structuresIntelligence,
    structuresSuperWeapons: structuresSuperWeapons,
    titans: titans,
    unitCannonMobile: unitCannonMobile,
    vehicles: vehicles,
    vehiclesAdvanced: vehiclesAdvanced,
    vehiclesBasic: vehiclesBasic,
    vehiclesBasicMobile: vehiclesBasicMobile,
    vehiclesAdvancedMobile: vehiclesAdvancedMobile,
    vehiclesMobile: vehiclesMobile,
  };
});
