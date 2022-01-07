define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"], function (
  gwaioUnits
) {
  var airBasic = [
    gwaioUnits.airFabber,
    gwaioUnits.airFactory,
    gwaioUnits.bumblebee,
    gwaioUnits.firefly,
    gwaioUnits.hummingbird,
    gwaioUnits.icarus,
    gwaioUnits.pelican,
  ];
  var airAdvanced = [
    gwaioUnits.airFabberAdvanced,
    gwaioUnits.airFactoryAdvanced,
    gwaioUnits.angel,
    gwaioUnits.hornet,
    gwaioUnits.horsefly,
    gwaioUnits.kestrel,
    gwaioUnits.phoenix,
    gwaioUnits.wyrm,
  ];
  var airMobile = [
    gwaioUnits.airFabber,
    gwaioUnits.airFabberAdvanced,
    gwaioUnits.angel,
    gwaioUnits.bumblebee,
    gwaioUnits.firefly,
    gwaioUnits.hornet,
    gwaioUnits.horsefly,
    gwaioUnits.hummingbird,
    gwaioUnits.icarus,
    gwaioUnits.kestrel,
    gwaioUnits.pelican,
    gwaioUnits.phoenix,
    gwaioUnits.wyrm,
  ];
  var botsBasic = [
    gwaioUnits.boom,
    gwaioUnits.botFabber,
    gwaioUnits.botFactory,
    gwaioUnits.dox,
    gwaioUnits.grenadier,
    gwaioUnits.spark,
    gwaioUnits.stinger,
    gwaioUnits.stitch,
  ];
  var botsAdvanced = [
    gwaioUnits.bluehawk,
    gwaioUnits.botFabberAdvanced,
    gwaioUnits.botFactoryAdvanced,
    gwaioUnits.colonel,
    gwaioUnits.gilE,
    gwaioUnits.locusts,
    gwaioUnits.mend,
    gwaioUnits.slammer,
  ];
  var botsMobile = [
    gwaioUnits.bluehawk,
    gwaioUnits.boom,
    gwaioUnits.botFabber,
    gwaioUnits.botFabberAdvanced,
    gwaioUnits.colonel,
    gwaioUnits.dox,
    gwaioUnits.gilE,
    gwaioUnits.grenadier,
    gwaioUnits.locusts,
    gwaioUnits.mend,
    gwaioUnits.slammer,
    gwaioUnits.spark,
    gwaioUnits.stinger,
    gwaioUnits.stitch,
  ];
  var orbitalBasic = [
    gwaioUnits.astraeus,
    gwaioUnits.avenger,
    gwaioUnits.hermes,
    gwaioUnits.orbitalFabber,
    gwaioUnits.orbitalLauncher,
  ];
  var orbitalAdvanced = [
    gwaioUnits.arkyd, // due to how GW treats orbital unlocks
    gwaioUnits.artemis,
    gwaioUnits.omega,
    gwaioUnits.orbitalFactory,
    gwaioUnits.radarSatelliteAdvanced,
    gwaioUnits.solarArray,
    gwaioUnits.sxx,
  ];
  var orbitalMobile = [
    gwaioUnits.arkyd,
    gwaioUnits.artemis,
    gwaioUnits.astraeus,
    gwaioUnits.avenger,
    gwaioUnits.hermes,
    gwaioUnits.omega,
    gwaioUnits.orbitalFabber,
    gwaioUnits.radarSatelliteAdvanced,
    gwaioUnits.solarArray,
    gwaioUnits.sxx,
  ];
  var navalBasic = [
    gwaioUnits.barnacle,
    gwaioUnits.barracuda,
    gwaioUnits.narwhal,
    gwaioUnits.navalFabber,
    gwaioUnits.navalFactory,
    gwaioUnits.orca,
    gwaioUnits.piranha,
  ];
  var navalAdvanced = [
    gwaioUnits.kaiju,
    gwaioUnits.kraken,
    gwaioUnits.leviathan,
    gwaioUnits.navalFabberAdvanced,
    gwaioUnits.navalFactoryAdvanced,
    gwaioUnits.squall,
    gwaioUnits.stingray,
    gwaioUnits.typhoon,
  ];
  var navalMobile = [
    gwaioUnits.barnacle,
    gwaioUnits.barracuda,
    gwaioUnits.kaiju,
    gwaioUnits.kraken,
    gwaioUnits.leviathan,
    gwaioUnits.narwhal,
    gwaioUnits.navalFabber,
    gwaioUnits.navalFabberAdvanced,
    gwaioUnits.orca,
    gwaioUnits.piranha,
    gwaioUnits.squall,
    gwaioUnits.stingray,
    gwaioUnits.typhoon,
  ];
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
  var structuresArtillery = [
    structuresArtilleryBasic,
    structuresArtilleryAdvanced,
  ];
  var structuresArtilleryAmmo = [
    structuresArtilleryBasicAmmo,
    structuresArtilleryAdvancedAmmo,
  ];
  var structuresArtilleryWeapons = [
    structuresArtilleryBasicWeapon,
    structuresArtilleryAdvancedWeapons,
  ];
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
  var structuresDefences = [
    structuresDefencesAdvanced,
    structuresDefencesBasic,
  ];
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
  var structuresEco = [
    structuresEcoAdvanced,
    structuresEcoBasic,
    structuresEcoStorage,
  ];
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
  var vehiclesBasic = [
    gwaioUnits.ant,
    gwaioUnits.drifter,
    gwaioUnits.inferno,
    gwaioUnits.skitter,
    gwaioUnits.spinner,
    gwaioUnits.stryker,
    gwaioUnits.vehicleFabber,
    gwaioUnits.vehicleFactory,
  ];
  var vehiclesAdvanced = [
    gwaioUnits.leveler,
    gwaioUnits.manhattan,
    gwaioUnits.sheller,
    gwaioUnits.storm,
    gwaioUnits.vanguard,
    gwaioUnits.vehicleFabberAdvanced,
    gwaioUnits.vehicleFactoryAdvanced,
  ];
  var vehiclesMobile = [
    gwaioUnits.ant,
    gwaioUnits.drifter,
    gwaioUnits.inferno,
    gwaioUnits.leveler,
    gwaioUnits.manhattan,
    gwaioUnits.sheller,
    gwaioUnits.skitter,
    gwaioUnits.spinner,
    gwaioUnits.storm,
    gwaioUnits.stryker,
    gwaioUnits.vanguard,
    gwaioUnits.vehicleFabber,
    gwaioUnits.vehicleFabberAdvanced,
  ];
  var starterUnits = [structuresEcoBasic, structuresDefencesBasic];
  return {
    airAdvanced: airAdvanced,
    airBasic: airBasic,
    airMobile: airMobile,
    botsAdvanced: botsAdvanced,
    botsBasic: botsBasic,
    botsMobile: botsMobile,
    navalAdvanced: navalAdvanced,
    navalBasic: navalBasic,
    navalMobile: navalMobile,
    orbitalAdvanced: orbitalAdvanced,
    orbitalBasic: orbitalBasic,
    orbitalMobile: orbitalMobile,
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
    starterUnits: starterUnits,
    structuresArtilleryAmmo: structuresArtilleryAmmo,
    structuresArtilleryWeapons: structuresArtilleryWeapons,
  };
});
