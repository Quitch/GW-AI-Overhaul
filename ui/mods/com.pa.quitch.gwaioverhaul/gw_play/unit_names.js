define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    units: [
      {
        name: "!LOC:Advanced Air Factory",
        path: gwaioUnits.airFactoryAdvanced,
      },
      {
        name: "!LOC:Air Factory",
        path: gwaioUnits.airFactory,
      },
      { name: "Firefly", path: gwaioUnits.firefly },
      { name: "Hornet", path: gwaioUnits.hornet },
      { name: "Wyrm", path: gwaioUnits.wyrm },
      { name: "Bumblebee", path: gwaioUnits.bumblebee },
      {
        name: "!LOC:Advanced Fab Aircraft",
        path: gwaioUnits.airFabberAdvanced,
      },
      {
        name: "!LOC:Fabrication Aircraft",
        path: gwaioUnits.airFabber,
      },
      { name: "Phoenix", path: gwaioUnits.phoenix },
      { name: "gwaioUnits.hummingbird", path: gwaioUnits.hummingbird },
      { name: "Kestrel", path: gwaioUnits.kestrel },
      { name: "gwaioUnits.icarus", path: gwaioUnits.icarus },
      { name: "Horsefly", path: gwaioUnits.horsefly },
      {
        name: "Angel",
        path: gwaioUnits.angel,
      },
      { name: "Zeus", path: gwaioUnits.zeus },
      { name: "Pelican", path: gwaioUnits.pelican },
      {
        name: "!LOC:Commander",
        path: gwaioUnits.commander,
      },
      {
        name: "Spinner",
        path: gwaioUnits.spinner,
      },
      {
        name: "Flak Cannon",
        path: gwaioUnits.flak,
      },
      {
        name: "Galata Turret",
        path: gwaioUnits.galata,
      },
      {
        name: "!LOC:Anti-Nuke Launcher",
        path: gwaioUnits.antiNukeLauncher,
      },
      {
        name: "Holkins",
        path: gwaioUnits.holkins,
      },
      {
        name: "Pelter",
        path: gwaioUnits.pelter,
      },
      {
        name: "Lob",
        path: gwaioUnits.lob,
      },
      {
        name: "Slammer",
        path: gwaioUnits.slammer,
      },
      { name: "Dox", path: gwaioUnits.dox },
      {
        name: "Stryker",
        path: gwaioUnits.stryker,
      },
      { name: "Stinger", path: gwaioUnits.stinger },
      { name: "Boom", path: gwaioUnits.boom },
      {
        name: "!LOC:Advanced Bot Factory",
        path: gwaioUnits.botFactoryAdvanced,
      },
      {
        name: "!LOC:Bot Factory",
        path: gwaioUnits.botFactory,
      },
      {
        name: "Grenadier",
        path: gwaioUnits.grenadier,
      },
      {
        name: "Locusts",
        path: gwaioUnits.locusts,
      },
      { name: "Gil-E", path: gwaioUnits.gilE },
      {
        name: "Recluse",
        path: "/pa/units/land/bot_spider_adv/bot_spider_adv.json",
      },
      {
        name: "Colonel",
        path: gwaioUnits.colonel,
      },
      {
        name: "Bluehawk",
        path: gwaioUnits.bluehawk,
      },
      { name: "Spark", path: gwaioUnits.spark },
      {
        name: "Catalyst",
        path: gwaioUnits.catalyst,
      },
      {
        name: "!LOC:Advanced Energy Plant",
        path: gwaioUnits.energyPlantAdvanced,
      },
      {
        name: "!LOC:Energy Plant",
        path: gwaioUnits.energyPlant,
      },
      {
        name: "!LOC:Energy Storage",
        path: gwaioUnits.energyStorage,
      },
      {
        name: "!LOC:Advanced Fabrication Bot",
        path: gwaioUnits.botFabberAdvanced,
      },
      {
        name: "!LOC:Fabrication Bot",
        path: gwaioUnits.botFabber,
      },
      {
        name: "Mend",
        path: gwaioUnits.mend,
      },
      {
        name: "Stitch",
        path: gwaioUnits.stitch,
      },
      {
        name: "!LOC:Advanced Fabrication Vehicle",
        path: gwaioUnits.vehicleFabberAdvanced,
      },
      {
        name: "!LOC:Fabrication Vehicle",
        path: gwaioUnits.vehicleFabber,
      },
      {
        name: "!LOC:Wall",
        path: gwaioUnits.wall,
      },
      {
        name: "!LOC:Land Mine",
        path: gwaioUnits.landMine,
      },
      { name: "Skitter", path: gwaioUnits.skitter },
      {
        name: "!LOC:Advanced Laser Defense Tower",
        path: gwaioUnits.laserDefenseTowerAdvanced,
      },
      {
        name: "!LOC:Single Laser Defense Tower",
        path: gwaioUnits.singleLaserDefenseTower,
      },
      {
        name: "!LOC:Laser Defense Tower",
        path: gwaioUnits.laserDefenseTower,
      },
      {
        name: "!LOC:Advanced Metal Extractor",
        path: gwaioUnits.metalExtractorAdvanced,
      },
      {
        name: "!LOC:Metal Extractor",
        path: gwaioUnits.metalExtractor,
      },
      {
        name: "!LOC:Metal Storage",
        path: gwaioUnits.metalStorage,
      },
      {
        name: "!LOC:Nuclear Missile Launcher",
        path: gwaioUnits.nukeLauncher,
      },
      {
        name: "!LOC:Advanced Radar",
        path: gwaioUnits.radarAdvanced,
      },
      { name: "!LOC:Radar", path: gwaioUnits.radar },
      {
        name: "Catapult",
        path: gwaioUnits.catapult,
      },
      { name: "Inferno", path: gwaioUnits.inferno },
      { name: "Storm", path: gwaioUnits.storm },
      {
        name: "Vanguard",
        path: gwaioUnits.vanguard,
      },
      {
        name: "Sheller",
        path: gwaioUnits.sheller,
      },
      { name: "Drifter", path: gwaioUnits.drifter },
      {
        name: "Leveler",
        path: gwaioUnits.leveler,
      },
      {
        name: "Ant",
        path: gwaioUnits.ant,
      },
      { name: "Manhattan", path: gwaioUnits.manhattan },
      {
        name: "!LOC:Teleporter",
        path: gwaioUnits.teleporter,
      },
      { name: "Atlas", path: gwaioUnits.atlas },
      {
        name: "Ragnarok",
        path: gwaioUnits.ragnarok,
      },
      { name: "Ares", path: gwaioUnits.ares },
      {
        name: "Unit Cannon",
        path: gwaioUnits.unitCannon,
      },
      {
        name: "!LOC:Vehicle Factory",
        path: gwaioUnits.vehicleFactoryAdvanced,
      },
      {
        name: "!LOC:Advanced Vehicle Factory",
        path: gwaioUnits.vehicleFactory,
      },
      {
        name: "!LOC:Planetary Radar",
        path: gwaioUnits.deepSpaceOrbitalRadar,
      },
      {
        name: "Anchor",
        path: gwaioUnits.anchor,
      },
      {
        name: "Halley",
        path: gwaioUnits.halley,
      },
      {
        name: "Umbrella",
        path: gwaioUnits.umbrella,
      },
      {
        name: "Jig",
        path: gwaioUnits.jig,
      },
      {
        name: "Omega",
        path: gwaioUnits.omega,
      },
      {
        name: "Exodus",
        path: "/pa/units/orbital/orbital_carrier/orbital_carrier.json",
      },
      {
        name: "!LOC:Orbital Fabrication Bot",
        path: gwaioUnits.orbitalFabber,
      },
      {
        name: "!LOC:Orbital Factory",
        path: gwaioUnits.orbitalFactory,
      },
      {
        name: "Avenger",
        path: gwaioUnits.avenger,
      },
      {
        name: "Astraeus",
        path: gwaioUnits.astraeus,
      },
      {
        name: "!LOC:SXX-1304 Laser Platform",
        path: gwaioUnits.sxx,
      },
      {
        name: "!LOC:Orbital Launcher",
        path: gwaioUnits.orbitalLauncher,
      },
      {
        name: "Hermes",
        path: gwaioUnits.hermes,
      },
      {
        name: "Artemis",
        path: gwaioUnits.artemis,
      },
      {
        name: "!LOC:Advanced Radar Satellite",
        path: gwaioUnits.radarSatelliteAdvanced,
      },
      {
        name: "ARKYD",
        path: gwaioUnits.arkyd,
      },
      {
        name: "!LOC:Solar Array",
        path: gwaioUnits.solarArray,
      },
      {
        name: "Helios",
        path: gwaioUnits.helios,
      },
      { name: "Barracuda", path: gwaioUnits.barracuda },
      { name: "Leviathan", path: gwaioUnits.leviathan },
      { name: "Orca", path: gwaioUnits.orca },
      {
        name: "Typhoon",
        path: gwaioUnits.typhoon,
      },
      { name: "Squall", path: gwaioUnits.squall },
      {
        name: "Barnacle",
        path: gwaioUnits.barnacle,
      },
      {
        name: "!LOC:Advanced Fabrication Ship",
        path: gwaioUnits.navalFabberAdvanced,
      },
      {
        name: "!LOC:Fabrication Ship",
        path: gwaioUnits.navalFabber,
      },
      { name: "Narwhal", path: gwaioUnits.narwhal },
      { name: "Kaiju", path: gwaioUnits.kaiju },
      {
        name: "Stingray",
        path: gwaioUnits.stingray,
      },
      {
        name: "!LOC:Advanced Naval Factory",
        path: gwaioUnits.navalFactoryAdvanced,
      },
      {
        name: "!LOC:Naval Factory",
        path: gwaioUnits.navalFactory,
      },
      { name: "Kraken", path: gwaioUnits.kraken },
      { name: "Jellyfish", path: "/pa/units/sea/sea_mine/sea_mine.json" },
      { name: "Piranha", path: gwaioUnits.piranha },
      {
        name: "!LOC:Advanced Torpedo Launcher",
        path: gwaioUnits.torpedoLauncherAdvanced,
      },
      {
        name: "!LOC:Torpedo Launcher",
        path: gwaioUnits.torpedoLauncher,
      },
    ],
  };
});
