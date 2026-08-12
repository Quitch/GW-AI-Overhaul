// The returned key names are a published API - third-party cards written from
// the New-GW-Cards template name them directly, so renaming one breaks them
// silently. What a group contains is not: change the membership freely as the
// roster changes. See docs/tech-cards.md.
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"], (
  gwoUnit
) => {
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
  const airMobileNoCluster = _.filter(
    airMobile,
    (unit) => unit !== gwoUnit.angel
  );
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
    gwoUnit.botFabberAdvanced
  );
  const botsAdvancedAmmo = [
    gwoUnit.bluehawkAmmo,
    gwoUnit.bluehawkAmmoOrbital,
    gwoUnit.bluehawkBeamAmmo,
    gwoUnit.colonelAmmo,
    gwoUnit.gilEAmmo,
    gwoUnit.gilEBeamAmmo,
    gwoUnit.locustsAmmo,
    gwoUnit.slammerAmmo,
    gwoUnit.slammerTorpedoLandAmmo,
    gwoUnit.slammerTorpedoWaterAmmo,
  ];
  const botsAdvancedWeapons = [
    gwoUnit.bluehawkBeam,
    gwoUnit.bluehawkWeapon,
    gwoUnit.bluehawkWeaponOrbital,
    gwoUnit.colonelWeapon,
    gwoUnit.gilEBeam,
    gwoUnit.gilEWeapon,
    gwoUnit.locustsWeapon,
    gwoUnit.slammerTorpedo,
    gwoUnit.slammerWeapon,
  ];
  const botsBasic = botsBasicMobile.concat(gwoUnit.botFactory);
  const botsAdvanced = botsAdvancedMobile.concat(gwoUnit.botFactoryAdvanced);
  const botsAmmo = botsBasicAmmo.concat(botsAdvancedAmmo);
  const botsWeapons = botsBasicWeapons.concat(botsAdvancedWeapons);
  const botsMobile = botsBasicMobile.concat(botsAdvancedMobile);
  const botsMobileNoCluster = _.filter(
    botsMobile,
    (unit) => unit !== gwoUnit.colonel
  );
  const botsCombat = botsBasicCombat.concat(botsAdvancedCombat);
  const bots = botsBasic.concat(botsAdvanced);

  const navalBasicCombat = [
    gwoUnit.barnacle,
    gwoUnit.barracuda,
    gwoUnit.narwhal,
    gwoUnit.orca,
    gwoUnit.piranha,
  ];
  const navalBasicMobile = navalBasicCombat.concat(gwoUnit.navalFabber);
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
    gwoUnit.stingrayBeamAmmo,
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
    gwoUnit.stingrayBeam,
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

  // Everything the base game tags UNITTYPE_Artillery and UNITTYPE_Mobile, less the Ares:
  // titans answer to titan tech, not to a domain group.
  const artilleryMobile = [
    gwoUnit.gilE,
    gwoUnit.grenadier,
    gwoUnit.leviathan,
    gwoUnit.sheller,
  ];

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
    gwoUnit.umbrellaBeamAmmo,
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
    gwoUnit.umbrellaBeam,
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
    gwoUnit.catapultBeamAmmo,
    gwoUnit.flakAmmo,
    gwoUnit.laserDefenseTowerAdvancedAmmo,
    gwoUnit.torpedoLauncherAdvancedLandAmmo,
    gwoUnit.torpedoLauncherAdvancedWaterAmmo,
  ];
  const structuresDefencesAdvancedWeapons = [
    gwoUnit.catapultBeam,
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
    // The Manhattan borrows the Dox's ammo spec and does its real damage on
    // death, so that death spec is what vehicle damage cards must reach.
    gwoUnit.manhattanDeath,
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

  // titansMobile, so a titan added there is picked up here automatically.
  const mobile = airMobile.concat(
    botsMobile,
    navalMobile,
    orbitalMobile,
    vehiclesMobile,
    titansMobile
  );
  const immobile = structures.concat(gwoUnit.ragnarok);
  const mobileNoCluster = airMobileNoCluster.concat(
    botsMobileNoCluster,
    navalMobile,
    orbitalMobile,
    vehiclesMobile,
    titansMobile
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

  // The titan groups already exclude the immobile Ragnarok, so these two drop
  // only the defensive structures - the same split combatMobile makes.
  const ammoMobile = airAmmo.concat(
    botsAmmo,
    navalAmmo,
    orbitalAmmo,
    titansAmmo,
    vehiclesAmmo
  );

  const commanderAmmo = [
    gwoUnit.commanderAAAmmo,
    gwoUnit.commanderAmmo,
    gwoUnit.commanderSecondaryAmmo,
    gwoUnit.commanderTorpedoLandAmmo,
    gwoUnit.commanderTorpedoWaterAmmo,
  ];
  const commanderWeapons = [
    gwoUnit.commanderAA,
    gwoUnit.commanderSecondary,
    gwoUnit.commanderWeaponBullet,
    gwoUnit.commanderWeaponLaser,
    gwoUnit.commanderWeaponMissile,
  ];

  // Armed only once their upgrade tech attaches a weapon, so they sit outside
  // the combat groups despite being in the domain rosters.
  const scoutAmmo = [gwoUnit.fireflyAmmo, gwoUnit.skitterAmmo];
  const scoutWeapons = [gwoUnit.fireflyWeapon, gwoUnit.skitterWeapon];

  // The silo payloads, the Ares stomp, and the Orca torpedo a card can lend out:
  // ammo no domain group claims.
  const unhomedAmmo = [
    gwoUnit.antiNukeLauncherAmmo,
    gwoUnit.aresStompAmmo,
    gwoUnit.nukeLauncherAmmo,
    gwoUnit.orcaTorpedoAmmo,
  ];
  const unhomedWeapons = [
    gwoUnit.antiNukeWeapon,
    gwoUnit.aresStomp,
    gwoUnit.nukeLauncherWeapon,
    gwoUnit.orcaTorpedo,
  ];

  // A death payload scales a self-destruct rather than a weapon, so no domain
  // group carries one - except the Manhattan's, which is its real damage.
  const deathAmmo = [
    gwoUnit.aresDeath,
    gwoUnit.atlasDeath,
    gwoUnit.commanderDeath,
    gwoUnit.commanderDeathAir,
    gwoUnit.heliosDeath,
    gwoUnit.jigDeath,
    gwoUnit.manhattanDeath,
    gwoUnit.ragnarokPbaoe,
    gwoUnit.wyrmDeath,
    gwoUnit.zeusDeath,
  ];

  // Every ammo in the game. uniq because the Manhattan's death nuke is also a
  // vehicle ammo, and addMods concatenates without deduplicating.
  const ammo = _.uniq(
    ammoMobile.concat(
      structuresDefencesAmmo,
      structuresArtilleryAmmo,
      commanderAmmo,
      unhomedAmmo,
      deathAmmo
    )
  );

  const weaponsMobile = airWeapons.concat(
    botsWeapons,
    navalWeapons,
    orbitalWeapons,
    titansWeapons,
    vehiclesWeapons
  );
  const weapons = _.uniq(
    weaponsMobile.concat(
      structuresDefencesWeapons,
      structuresArtilleryWeapons,
      commanderWeapons,
      unhomedWeapons
    )
  );

  // What combatMobile carries: the mobile groups drop the defensive structures,
  // and these drop the titans and scouts too, then add the Commander's.
  const combatMobileAmmo = _.difference(
    ammoMobile,
    titansAmmo,
    scoutAmmo
  ).concat(commanderAmmo);
  const combatMobileWeapons = _.difference(
    weaponsMobile,
    titansWeapons,
    scoutWeapons
  ).concat(commanderWeapons);

  // The Commander belongs to no domain roster, so mobile cannot reach it.
  const units = mobile.concat(immobile, gwoUnit.commander);
  const unitsNoCluster = mobileNoCluster.concat(immobile, gwoUnit.commander);

  const fabberBuildArms = [
    gwoUnit.airFabberAdvancedBuildArm,
    gwoUnit.airFabberBuildArm,
    gwoUnit.angelBuildArm,
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
    gwoUnit.vehicleFabberAdvancedBuildArm,
    gwoUnit.vehicleFabberBuildArm,
  ];

  // A factory here builds mobile units, so the missile launchers are out despite
  // their UNITTYPE_Factory flag - their arms only ever produce ammo.
  const factoryBuildArms = [
    gwoUnit.airFactoryAdvancedBuildArm,
    gwoUnit.airFactoryBuildArm,
    gwoUnit.botFactoryAdvancedBuildArm,
    gwoUnit.botFactoryBuildArm,
    gwoUnit.navalFactoryAdvancedBuildArm,
    gwoUnit.navalFactoryBuildArm,
    gwoUnit.orbitalFactoryBuildArm,
    gwoUnit.orbitalLauncherBuildArm,
    gwoUnit.unitCannonBuildArm,
    gwoUnit.vehicleFactoryAdvancedBuildArm,
    gwoUnit.vehicleFactoryBuildArm,
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
  const combatMobile = _.reject(combat, (unit) =>
    _.includes(structuresDefences, unit)
  );

  return {
    air,
    airAdvanced,
    airAdvancedCombat,
    airAdvancedMobile,
    airAmmo,
    airBasic,
    airBasicCombat,
    airBasicMobile,
    airCombat,
    airFactories,
    airMobile,
    airMobileNoCluster,
    airWeapons,
    ammo,
    ammoMobile,
    artilleryMobile,
    botFactories,
    bots,
    botsAdvanced,
    botsAdvancedCombat,
    botsAdvancedMobile,
    botsAmmo,
    botsBasic,
    botsBasicCombat,
    botsBasicMobile,
    botsCombat,
    botsMobile,
    botsMobileNoCluster,
    botsWeapons,
    combat,
    combatMobile,
    combatMobileAmmo,
    combatMobileWeapons,
    commanderAmmo,
    energyAll,
    energyIntel,
    energyUnits,
    energyWeapons,
    fabberBuildArms,
    fabbers,
    fabbersAdvanced,
    fabbersBasic,
    factories,
    factoriesAdvanced,
    factoriesBasic,
    factoryBuildArms,
    immobile,
    mobile,
    mobileNoCluster,
    naval,
    navalAdvanced,
    navalAdvancedCombat,
    navalAdvancedMobile,
    navalAmmo,
    navalBasic,
    navalBasicCombat,
    navalBasicMobile,
    navalCombat,
    navalFactories,
    navalMobile,
    navalWeapons,
    nomadStructures,
    orbital,
    orbitalAdvanced,
    orbitalAdvancedCombat,
    orbitalAdvancedMobile,
    orbitalAmmo,
    orbitalBasic,
    orbitalBasicCombat,
    orbitalBasicMobile,
    orbitalCombat,
    orbitalFactories,
    orbitalMobile,
    orbitalWeapons,
    starterUnitsAdvanced,
    structures,
    structuresArtillery,
    structuresArtilleryAdvanced,
    structuresArtilleryAmmo,
    structuresArtilleryBasic,
    structuresArtilleryWeapons,
    structuresDefences,
    structuresDefencesAdvanced,
    structuresDefencesAmmo,
    structuresDefencesBasic,
    structuresDefencesWeapons,
    structuresEco,
    structuresEcoAdvanced,
    structuresEcoBasic,
    structuresEcoStorage,
    structuresFactories,
    structuresIntel,
    structuresIntelAdvanced,
    structuresIntelBasic,
    structuresSuperWeapons,
    teleporters,
    titans,
    titansAmmo,
    titansMobile,
    titansWeapons,
    unitCannonMobile,
    units,
    unitsNoCluster,
    vehicleAdvancedCombat: vehiclesAdvancedCombat,
    vehicleBasicCombat: vehiclesBasicCombat,
    vehicleFactories,
    vehicles,
    vehiclesAdvanced,
    vehiclesAdvancedMobile,
    vehiclesAmmo,
    vehiclesBasic,
    vehiclesBasicMobile,
    vehiclesCombat,
    vehiclesMobile,
    vehiclesWeapons,
    weapons,
    weaponsMobile,
  };
});
