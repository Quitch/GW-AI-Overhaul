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
    gwaioUnits.astraeus,
    gwaioUnits.avenger,
    gwaioUnits.hermes,
    gwaioUnits.orbitalFabber,
  ];
  var orbitalAdvancedMobile = [
    gwaioUnits.arkyd, // due to how GW treats orbital unlocks
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
  var structuresDefences = structuresDefencesAdvanced.concat(
    structuresDefencesBasic
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
  var structuresEco = structuresEcoAdvanced.concat(
    structuresEcoBasic,
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

  var starterUnits = structuresEcoBasic.concat(structuresDefencesBasic);

  return {
    airBasic: airBasic,
    airAdvanced: airAdvanced,
    airMobile: airMobile,
    air: air,
    botsBasic: botsBasic,
    botsAdvanced: botsAdvanced,
    botsMobile: botsMobile,
    bots: bots,
    navalBasic: navalBasic,
    navalAdvanced: navalAdvanced,
    navalMobile: navalMobile,
    naval: naval,
    orbitalBasic: orbitalBasic,
    orbitalAdvanced: orbitalAdvanced,
    orbitalMobile: orbitalMobile,
    orbital: orbital,
    structures: structures,
    structuresArtillery: structuresArtillery,
    structuresDefences: structuresDefences,
    structuresEco: structuresEco,
    structuresFactories: structuresFactories,
    structuresIntelligence: structuresIntelligence,
    structuresSuperWeapons: structuresSuperWeapons,
    titans: titans,
    vehiclesAdvanced: vehiclesAdvanced,
    vehiclesBasic: vehiclesBasic,
    vehiclesMobile: vehiclesMobile,
    vehicles: vehicles,
    starterUnits: starterUnits,
    structuresArtilleryAmmo: structuresArtilleryAmmo,
    structuresArtilleryWeapons: structuresArtilleryWeapons,
  };
});
