define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"], function (
  gwoUnit
) {
  const airBasicCombat = [
    gwoUnit.bumblebee,
    gwoUnit.hummingbird,
    gwoUnit.icarus,
    gwoUnit.pelican,
  ];
  const airBasicMobile = airBasicCombat.concat(
    gwoUnit.airFabber,
    gwoUnit.firefly
  );
  const airAdvancedCombat = [
    gwoUnit.angel,
    gwoUnit.hornet,
    gwoUnit.horsefly,
    gwoUnit.kestrel,
    gwoUnit.phoenix,
    gwoUnit.wyrm,
  ];
  const airAdvancedMobile = airAdvancedCombat.concat(gwoUnit.airFabberAdvanced);
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
  const airCombat = airBasicCombat.concat(airAdvancedCombat);
  const air = airBasic.concat(airAdvanced);

  const botsBasicCombat = [
    gwoUnit.boom,
    gwoUnit.dox,
    gwoUnit.grenadier,
    gwoUnit.spark,
    gwoUnit.stinger,
  ];
  const botsBasicMobile = botsBasicCombat.concat(
    gwoUnit.botFabber,
    gwoUnit.stitch
  );
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
  const botsAdvancedCombat = [
    gwoUnit.bluehawk,
    gwoUnit.colonel,
    gwoUnit.gilE,
    gwoUnit.locusts,
    gwoUnit.mend,
    gwoUnit.slammer,
  ];
  const botsAdvancedMobile = botsAdvancedCombat.concat(
    gwoUnit.botFabberAdvanced,
    gwoUnit.mend
  );
  const botsAdvancedAmmo = [
    gwoUnit.bluehawkAmmo,
    gwoUnit.bluehawkAmmoOrbital,
    gwoUnit.colonelAmmo,
    gwoUnit.gilEAmmo,
    gwoUnit.locustsAmmo,
    gwoUnit.slammerAmmo,
    gwoUnit.slammerTorpedoLandAmmo,
    gwoUnit.slammerTorpedoWaterAmmo,
  ];
  const botsAdvancedWeapons = [
    gwoUnit.bluehawkWeapon,
    gwoUnit.bluehawkWeaponOrbital,
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
  const botsCombat = botsBasicCombat.concat(botsAdvancedCombat);
  const bots = botsBasic.concat(botsAdvanced);

  const navalBasicCombat = [
    gwoUnit.barnacle,
    gwoUnit.barracuda,
    gwoUnit.narwhal,
    gwoUnit.navalFabber,
    gwoUnit.orca,
    gwoUnit.piranha,
  ];
  const navalBasicMobile = navalBasicCombat.concat(
    gwoUnit.barnacle,
    gwoUnit.navalFabber
  );
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
  const navalAdvancedCombat = [
    gwoUnit.kaiju,
    gwoUnit.kraken,
    gwoUnit.leviathan,
    gwoUnit.navalFabberAdvanced,
    gwoUnit.squall,
    gwoUnit.stingray,
    gwoUnit.typhoon,
  ];
  const navalAdvancedMobile = navalAdvancedCombat.concat(
    gwoUnit.navalFabberAdvanced
  );
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
  const navalCombat = navalBasicCombat.concat(navalAdvancedCombat);
  const naval = navalBasic.concat(navalAdvanced);

  const orbitalBasicCombat = [gwoUnit.avenger];
  const orbitalBasicMobile = orbitalBasicCombat.concat(
    gwoUnit.arkyd,
    gwoUnit.astraeus,
    gwoUnit.hermes,
    gwoUnit.orbitalFabber
  );
  const orbitalBasicAmmo = [gwoUnit.avengerAmmo];
  const orbitalBasicWeapons = [gwoUnit.avengerWeapon];
  const orbitalAdvancedCombat = [gwoUnit.artemis, gwoUnit.omega, gwoUnit.sxx];
  const orbitalAdvancedMobile = orbitalAdvancedCombat.concat(
    gwoUnit.radarSatelliteAdvanced,
    gwoUnit.solarArray
  );
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
  const orbitalCombat = orbitalBasicCombat.concat(orbitalAdvancedCombat);
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
    gwoUnit.kessler,
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
    gwoUnit.kesslerAmmo,
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
    gwoUnit.kesslerWeapon,
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
  const titansMobile = _.without(titans, gwoUnit.ragnarok);
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

  const vehiclesBasicCombat = [
    gwoUnit.ant,
    gwoUnit.drifter,
    gwoUnit.inferno,
    gwoUnit.spinner,
    gwoUnit.stryker,
  ];
  const vehiclesBasicMobile = vehiclesBasicCombat.concat(
    gwoUnit.skitter,
    gwoUnit.vehicleFabber
  );
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
  const vehiclesAdvancedCombat = [
    gwoUnit.leveler,
    gwoUnit.manhattan,
    gwoUnit.sheller,
    gwoUnit.storm,
    gwoUnit.vanguard,
    gwoUnit.ward,
  ];
  const vehiclesAdvancedMobile = vehiclesAdvancedCombat.concat(
    gwoUnit.nyx,
    gwoUnit.vehicleFabberAdvanced
  );
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
    gwoUnit.wardWeapon,
  ];
  const vehiclesBasic = vehiclesBasicMobile.concat(gwoUnit.vehicleFactory);
  const vehiclesAdvanced = vehiclesAdvancedMobile.concat(
    gwoUnit.vehicleFactoryAdvanced
  );
  const vehiclesAmmo = vehiclesBasicAmmo.concat(vehiclesAdvancedAmmo);
  const vehiclesWeapons = vehiclesBasicWeapons.concat(vehiclesAdvancedWeapons);
  const vehiclesMobile = vehiclesBasicMobile.concat(vehiclesAdvancedMobile);
  const vehiclesCombat = vehiclesBasicCombat.concat(vehiclesAdvancedCombat);
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
    gwoUnit.orbitalLauncher,
    gwoUnit.vehicleFactory,
  ];
  const factoriesAdvanced = [
    gwoUnit.airFactoryAdvanced,
    gwoUnit.botFactoryAdvanced,
    gwoUnit.navalFactoryAdvanced,
    gwoUnit.orbitalFactory,
    gwoUnit.vehicleFactoryAdvanced,
  ];
  const factories = factoriesBasic.concat(
    factoriesAdvanced,
    gwoUnit.antiNukeLauncher,
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
    gwoUnit.nyx,
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

  const airFactories = [gwoUnit.airFactory, gwoUnit.airFactoryAdvanced];
  const botFactories = [gwoUnit.botFactory, gwoUnit.botFactoryAdvanced];
  const navalFactories = [gwoUnit.navalFactory, gwoUnit.navalFactoryAdvanced];
  const orbitalFactories = [gwoUnit.orbitalLauncher, gwoUnit.orbitalFactory];
  const vehicleFactories = [
    gwoUnit.vehicleFactory,
    gwoUnit.vehicleFactoryAdvanced,
  ];
  const nomadStructures = structuresDefences.concat(
    structuresIntel,
    structuresArtillery,
    structuresEcoStorage,
    gwoUnit.energyPlant,
    gwoUnit.energyPlantAdvanced,
    gwoUnit.jig
  );
  const combat = airCombat.concat(
    botsCombat,
    navalCombat,
    orbitalCombat,
    vehiclesCombat,
    structuresDefences,
    gwoUnit.commander
  );

  return {
    air: air,
    airAdvanced: airAdvanced,
    airAdvancedCombat: airAdvancedCombat,
    airAdvancedMobile: airAdvancedMobile,
    airAmmo: airAmmo,
    airBasic: airBasic,
    airBasicCombat: airBasicCombat,
    airBasicMobile: airBasicMobile,
    airCombat: airCombat,
    airFactories: airFactories,
    airMobile: airMobile,
    airMobileNoCluster: airMobileNoCluster,
    airWeapons: airWeapons,
    ammo: ammo,
    botFactories: botFactories,
    bots: bots,
    botsAdvanced: botsAdvanced,
    botsAdvancedCombat: botsAdvancedCombat,
    botsAdvancedMobile: botsAdvancedMobile,
    botsAmmo: botsAmmo,
    botsBasic: botsBasic,
    botsBasicCombat: botsBasicCombat,
    botsBasicMobile: botsBasicMobile,
    botsCombat: botsCombat,
    botsMobile: botsMobile,
    botsMobileNoCluster: botsMobileNoCluster,
    botsWeapons: botsWeapons,
    clusterCommanders: clusterCommanders,
    combat: combat,
    commanderAmmo: commanderAmmo,
    energyAll: energyAll,
    energyIntel: energyIntel,
    energyUnits: energyUnits,
    energyWeapons: energyWeapons,
    fabberBuildArms: fabberBuildArms,
    fabbers: fabbers,
    fabbersAdvanced: fabbersAdvanced,
    fabbersBasic: fabbersBasic,
    factories: factories,
    factoriesAdvanced: factoriesAdvanced,
    factoriesBasic: factoriesBasic,
    immobile: immobile,
    mobile: mobile,
    mobileNoCluster: mobileNoCluster,
    naval: naval,
    navalAdvanced: navalAdvanced,
    navalAdvancedCombat: navalAdvancedCombat,
    navalAdvancedMobile: navalAdvancedMobile,
    navalAmmo: navalAmmo,
    navalBasic: navalBasic,
    navalBasicCombat: navalBasicCombat,
    navalBasicMobile: navalBasicMobile,
    navalCombat: navalCombat,
    navalFactories: navalFactories,
    navalMobile: navalMobile,
    navalWeapons: navalWeapons,
    nomadStructures: nomadStructures,
    orbital: orbital,
    orbitalAdvanced: orbitalAdvanced,
    orbitalAdvancedCombat: orbitalAdvancedCombat,
    orbitalAdvancedMobile: orbitalAdvancedMobile,
    orbitalAmmo: orbitalAmmo,
    orbitalBasic: orbitalBasic,
    orbitalBasicCombat: orbitalBasicCombat,
    orbitalBasicMobile: orbitalBasicMobile,
    orbitalCombat: orbitalCombat,
    orbitalFactories: orbitalFactories,
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
    titansMobile: titansMobile,
    titansWeapons: titansWeapons,
    unitCannonMobile: unitCannonMobile,
    units: units,
    unitsNoCluster: unitsNoCluster,
    vehicleAdvancedCombat: vehiclesAdvancedCombat,
    vehicleBasicCombat: vehiclesBasicCombat,
    vehicleFactories: vehicleFactories,
    vehicles: vehicles,
    vehiclesAdvanced: vehiclesAdvanced,
    vehiclesAdvancedMobile: vehiclesAdvancedMobile,
    vehiclesAmmo: vehiclesAmmo,
    vehiclesBasic: vehiclesBasic,
    vehiclesBasicMobile: vehiclesBasicMobile,
    vehiclesCombat: vehiclesCombat,
    vehiclesMobile: vehiclesMobile,
    vehiclesWeapons: vehiclesWeapons,
    weapons: weapons,
  };
});
