define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoUnit, gwoGroup) {
  const vehicleFactories = [gwoUnit.vehicleFactory, gwoUnit.vehicleFactoryAdvanced]     
  const botFactories = [gwoUnit.botFactory, gwoUnit.botFactoryAdvanced]
  const airFactories = [gwoUnit.airFactory, gwoUnit.airFactoryAdvanced]
  const mobileStructures = gwoGroup.structuresDefences.concat(
    gwoGroup.structuresIntel,
    gwoGroup.structuresArtillery,
    gwoGroup.structuresEcoStorage,
    gwoUnit.energyPlant,
    gwoUnit.energyPlantAdvanced,
    gwoUnit.jig
  );
  return {
    cards: [
      { id: "gwaio_enable_bot_aa" },
      { id: "gwc_add_card_slot" },
      { id: "gwc_bld_efficiency_cdr", units: [gwoUnit.commander] },
      {
        id: "gwc_bld_efficiency_fabs",
        units: gwoGroup.fabbers.concat(gwoGroup.factories),
      },
      { id: "gwc_combat_air", units: gwoGroup.airMobile },
      { id: "gwc_combat_bots", units: gwoGroup.botsMobile },
      { id: "gwc_combat_commander", units: [gwoUnit.commander] },
      { id: "gwc_combat_orbital", units: gwoGroup.orbitalMobile },
      { id: "gwc_combat_sea", units: gwoGroup.navalMobile },
      { id: "gwc_combat_structures", units: gwoGroup.structures },
      { id: "gwc_combat_vehicles", units: gwoGroup.vehiclesMobile },
      { id: "gwc_cost_air", units: gwoGroup.airMobile },
      { id: "gwc_cost_artillery", units: gwoGroup.structuresArtillery },
      { id: "gwc_cost_bots", units: gwoGroup.botsMobile },
      { id: "gwc_cost_defenses", units: gwoGroup.structuresDefences },
      { id: "gwc_cost_economy", units: gwoGroup.structuresEco },
      {
        id: "gwc_cost_intel",
        units: gwoGroup.energyIntel.concat(
          gwoUnit.hermes,
          gwoUnit.skitter,
          gwoUnit.firefly,
          gwoUnit.stingray,
          gwoUnit.stitch,
          gwoUnit.mend,
          gwoUnit.barnacle,
          gwoUnit.teleporter
        ),
      },
      { id: "gwc_cost_orbital", units: gwoGroup.orbitalMobile },
      { id: "gwc_cost_sea", units: gwoGroup.navalMobile },
      { id: "gwc_cost_super_weapons", units: gwoGroup.structuresSuperWeapons },
      { id: "gwc_cost_titans", units: gwoGroup.titans },
      { id: "gwc_cost_vehicles", units: gwoGroup.vehiclesMobile },
      { id: "gwc_damage_air", units: gwoGroup.airMobile },
      { id: "gwc_damage_artillery", units: gwoGroup.structuresArtillery },
      {
        id: "gwc_damage_bots",
        units: [
          gwoUnit.bluehawk,
          gwoUnit.boom,
          gwoUnit.colonel,
          gwoUnit.dox,
          gwoUnit.gilE,
          gwoUnit.locusts,
          gwoUnit.slammer,
          gwoUnit.spark,
          gwoUnit.stinger,
        ],
      },
      { id: "gwc_damage_commander", units: [gwoUnit.commander] },
      {
        id: "gwc_damage_defenses",
        units: [
          gwoUnit.anchor,
          gwoUnit.catapult,
          gwoUnit.flak,
          gwoUnit.galata,
          gwoUnit.landMine,
          gwoUnit.laserDefenseTower,
          gwoUnit.laserDefenseTowerAdvanced,
          gwoUnit.singleLaserDefenseTower,
          gwoUnit.torpedoLauncher,
          gwoUnit.torpedoLauncherAdvanced,
          gwoUnit.umbrella,
        ],
      },
      {
        id: "gwc_damage_orbital",
        units: [
          gwoUnit.anchor,
          gwoUnit.artemis,
          gwoUnit.avenger,
          gwoUnit.omega,
          gwoUnit.sxx,
        ],
      },
      {
        id: "gwc_damage_sea",
        units: [
          gwoUnit.barracuda,
          gwoUnit.kaiju,
          gwoUnit.kraken,
          gwoUnit.leviathan,
          gwoUnit.narwhal,
          gwoUnit.orca,
          gwoUnit.piranha,
          gwoUnit.squall,
          gwoUnit.stingray,
        ],
      },
      {
        id: "gwc_damage_vehicles",
        units: [
          gwoUnit.ant,
          gwoUnit.drifter,
          gwoUnit.inferno,
          gwoUnit.leveler,
          gwoUnit.skitter,
          gwoUnit.spinner,
          gwoUnit.storm,
          gwoUnit.vanguard,
        ],
      },
      {
        id: "gwc_enable_air_all",
        units: gwoGroup.starterUnitsAdvanced.concat(gwoGroup.air),
      },
      { id: "gwc_enable_air_t1", units: gwoGroup.airBasic },
      {
        id: "gwc_enable_air_t2", // not used
        units: gwoGroup.airAdvanced,
      },
      { id: "gwc_enable_artillery", units: gwoGroup.structuresArtillery },
      {
        id: "gwc_enable_bots_all",
        units: gwoGroup.starterUnitsAdvanced.concat(gwoGroup.bots),
      },
      { id: "gwc_enable_bots_t1", units: gwoGroup.botsBasic },
      {
        id: "gwc_enable_bots_t2", // not used
        units: gwoGroup.botsAdvanced,
      },
      {
        id: "gwc_enable_defenses_t2",
        units: [
          gwoUnit.catapult,
          gwoUnit.flak,
          gwoUnit.laserDefenseTowerAdvanced,
          gwoUnit.torpedoLauncherAdvanced,
        ],
      },
      {
        id: "gwc_enable_orbital_all",
        units: gwoGroup.orbitalAdvanced, // basic starts unlocked
      },
      {
        id: "gwc_enable_orbital_t1", // not used
        units: gwoGroup.orbitalBasic,
      },
      {
        id: "gwc_enable_orbital_t2", // not used
        units: gwoGroup.orbitalAdvanced,
      },
      {
        id: "gwc_enable_sea_all",
        units: gwoGroup.starterUnitsAdvanced.concat(gwoGroup.navalAdvanced), // basic starts unlocked
      },
      {
        id: "gwc_enable_sea_t1", // not used
        units: gwoGroup.navalBasic,
      },
      {
        id: "gwc_enable_sea_t2", // not used
        units: gwoGroup.navalAdvanced,
      },
      {
        id: "gwc_enable_super_weapons", // not used
        units: gwoGroup.structuresSuperWeapons,
      },
      { id: "gwc_enable_titans", units: gwoGroup.titans },
      {
        id: "gwc_enable_vehicles_all",
        units: gwoGroup.starterUnitsAdvanced.concat(gwoGroup.vehicles),
      },
      { id: "gwc_enable_vehicles_t1", units: gwoGroup.vehiclesBasic },
      {
        id: "gwc_enable_vehicles_t2", // not used
        units: gwoGroup.vehiclesAdvanced,
      },
      {
        id: "gwc_energy_efficiency_all",
        units: gwoGroup.energyAll.concat(gwoGroup.teleporters),
      },
      {
        id: "gwc_energy_efficiency_intel",
        units: gwoGroup.energyIntel.concat(gwoGroup.teleporters),
      },
      { id: "gwc_energy_efficiency_weapons", units: gwoGroup.energyUnits },
      { id: "gwc_health_air", units: gwoGroup.airMobile },
      { id: "gwc_health_bots", units: gwoGroup.botsMobile },
      { id: "gwc_health_commander", units: [gwoUnit.commander] },
      { id: "gwc_health_orbital", units: gwoGroup.orbitalMobile },
      { id: "gwc_health_sea", units: gwoGroup.navalMobile },
      { id: "gwc_health_structures", units: gwoGroup.structures },
      { id: "gwc_health_vehicles", units: gwoGroup.vehiclesMobile },
      { id: "gwc_minion" },
      { id: "gwc_speed_air", units: gwoGroup.airMobile },
      { id: "gwc_speed_bots", units: gwoGroup.botsMobile },
      { id: "gwc_speed_commander", units: [gwoUnit.commander] },
      { id: "gwc_speed_orbital", units: gwoGroup.orbitalMobile },
      { id: "gwc_speed_sea", units: gwoGroup.navalMobile },
      { id: "gwc_speed_vehicles", units: gwoGroup.vehiclesMobile },
      {
        id: "gwc_storage_1",
        units: gwoGroup.structuresEcoStorage.concat(gwoUnit.commander),
      },
      {
        id: "gwc_storage_and_buff",
        units: gwoGroup.structuresEco,
      },
      { id: "gwaio_upgrade_wyrm", units: [gwoUnit.wyrm] },
      { id: "gwaio_upgrade_ubercannon_structure", units: [gwoUnit.commander] },
      { id: "gwaio_upgrade_omega", units: [gwoUnit.omega] },
      { id: "gwaio_upgrade_lob", units: [gwoUnit.lob] },
      { id: "gwaio_upgrade_dox", units: [gwoUnit.dox] },
      { id: "gwaio_upgrade_gile", units: [gwoUnit.gilE] },
      { id: "gwaio_upgrade_kaiju", units: [gwoUnit.kaiju] },
      { id: "gwaio_upgrade_skitter", units: [gwoUnit.skitter] },
      { id: "gwaio_upgrade_leveler", units: [gwoUnit.leveler] },
      { id: "gwaio_upgrade_nukes", units: [gwoUnit.nukeLauncher] },
      { id: "gwaio_upgrade_firefly", units: [gwoUnit.firefly] },
      { id: "gwaio_upgrade_hummingbird", units: [gwoUnit.hummingbird] },
      { id: "gwaio_upgrade_angel", units: [gwoUnit.angel] },
      { id: "gwaio_upgrade_narwhal", units: [gwoUnit.narwhal] },
      { id: "gwaio_upgrade_teleporter", units: [gwoUnit.teleporter] },
      {
        id: "gwaio_upgrade_singlelaserdefensetower",
        units: [gwoUnit.singleLaserDefenseTower],
      },
      { id: "gwaio_upgrade_astraeus", units: [gwoUnit.astraeus] },
      { id: "gwaio_upgrade_sxx", units: [gwoUnit.sxx] },
      { id: "gwaio_upgrade_jig", units: [gwoUnit.jig] },
      { id: "gwaio_upgrade_energystorage", units: [gwoUnit.energyStorage] },
      { id: "gwaio_upgrade_metalstorage", units: [gwoUnit.metalStorage] },
      { id: "gwaio_upgrade_icarus", units: [gwoUnit.icarus] },
      { id: "gwaio_upgrade_phoenix", units: [gwoUnit.phoenix] },
      { id: "gwaio_upgrade_leviathan", units: [gwoUnit.leviathan] },
      { id: "gwaio_upgrade_orca", units: [gwoUnit.orca] },
      { id: "gwaio_upgrade_piranha", units: [gwoUnit.piranha] },
      { id: "gwaio_upgrade_horsefly", units: [gwoUnit.horsefly] },
      { id: "gwaio_upgrade_hornet", units: [gwoUnit.hornet] },
      { id: "gwaio_upgrade_pelican", units: [gwoUnit.pelican] },
      { id: "gwaio_upgrade_grenadier", units: [gwoUnit.grenadier] },
      { id: "gwaio_upgrade_boom", units: [gwoUnit.boom] },
      { id: "gwaio_upgrade_holkins", units: [gwoUnit.holkins] },
      { id: "gwaio_upgrade_manhattan", units: [gwoUnit.manhattan] },
      { id: "gwaio_upgrade_colonel", units: [gwoUnit.colonel] },
      { id: "gwaio_upgrade_vanguard", units: [gwoUnit.vanguard] },
      { id: "gwaio_upgrade_torpedolauncher", units: [gwoUnit.torpedoLauncher] },
      {
        id: "gwaio_upgrade_advancedtorpedolauncher",
        units: [gwoUnit.torpedoLauncherAdvanced],
      },
      { id: "gwaio_upgrade_catalyst", units: [gwoUnit.catalyst] },
      { id: "gwaio_upgrade_halley", units: [gwoUnit.halley] },
      { id: "gwaio_upgrade_ragnarok", units: [gwoUnit.ragnarok] },
      { id: "gwaio_upgrade_radar", units: [gwoUnit.radar] },
      {
        id: "gwaio_upgrade_radarjammer",
        units: [gwoUnit.radarJammingStation],
      },
      { id: "gwaio_upgrade_advancedradar", units: [gwoUnit.radarAdvanced] },
      {
        id: "gwaio_upgrade_laserdefensetower",
        units: [gwoUnit.laserDefenseTower],
      },
      { id: "gwaio_upgrade_antinuke", units: [gwoUnit.antiNukeLauncher] },
      { id: "gwaio_upgrade_squall", units: [gwoUnit.squall] },
      { id: "gwaio_upgrade_typhoon", units: [gwoUnit.typhoon] },
      { id: "gwaio_upgrade_inferno", units: [gwoUnit.inferno] },
      { id: "gwaio_upgrade_sheller", units: [gwoUnit.sheller] },
      { id: "gwaio_upgrade_bumblebee", units: [gwoUnit.bumblebee] },
      { id: "gwaio_upgrade_kestrel", units: [gwoUnit.kestrel] },
      { id: "gwaio_upgrade_spark", units: [gwoUnit.spark] },
      { id: "gwaio_upgrade_stinger", units: [gwoUnit.stinger] },
      { id: "gwaio_upgrade_bluehawk", units: [gwoUnit.bluehawk] },
      { id: "gwaio_upgrade_locusts", units: [gwoUnit.locusts] },
      { id: "gwaio_upgrade_slammer", units: [gwoUnit.slammer] },
      { id: "gwaio_upgrade_ant", units: [gwoUnit.ant] },
      { id: "gwaio_upgrade_spinner", units: [gwoUnit.spinner] },
      { id: "gwaio_upgrade_storm", units: [gwoUnit.storm] },
      { id: "gwaio_upgrade_drifter", units: [gwoUnit.drifter] },
      { id: "gwaio_upgrade_stryker", units: [gwoUnit.stryker] },
      { id: "gwaio_upgrade_barracuda", units: [gwoUnit.barracuda] },
      { id: "gwaio_upgrade_stingray", units: [gwoUnit.stingray] },
      { id: "gwaio_upgrade_kraken", units: [gwoUnit.kraken] },
      {
        id: "gwaio_upgrade_advancedlaserdefensetower",
        units: [gwoUnit.laserDefenseTowerAdvanced],
      },
      { id: "gwaio_upgrade_catapult", units: [gwoUnit.catapult] },
      {
        id: "gwaio_upgrade_airfactory",
        units: gwoGroup.starterUnitsAdvanced.concat(
          gwoUnit.airFactory,
          gwoGroup.airAdvancedMobile
        ),
      },
      {
        id: "gwaio_upgrade_botfactory",
        units: gwoGroup.starterUnitsAdvanced.concat(
          gwoUnit.botFactory,
          gwoGroup.botsAdvancedMobile
        ),
      },
      {
        id: "gwaio_upgrade_navalfactory",
        units: gwoGroup.starterUnitsAdvanced.concat(
          gwoUnit.navalFactory,
          gwoGroup.navalAdvancedMobile
        ),
      },
      {
        id: "gwaio_upgrade_orbitallauncher",
        units: gwoGroup.orbitalAdvanced.concat(gwoUnit.orbitalLauncher),
      },
      { id: "gwaio_upgrade_unitcannon", units: [gwoUnit.unitCannon] },
      {
        id: "gwaio_upgrade_vehiclefactory",
        units: gwoGroup.starterUnitsAdvanced.concat(
          gwoUnit.vehicleFactory,
          gwoGroup.vehiclesAdvancedMobile
        ),
      },
      { id: "gwaio_upgrade_hermes", units: [gwoUnit.hermes] },
      {
        id: "gwaio_upgrade_advancedradarsatellite",
        units: [gwoUnit.radarSatelliteAdvanced],
      },
      { id: "gwaio_upgrade_umbrella", units: [gwoUnit.umbrella] },
      { id: "gwaio_upgrade_galata", units: [gwoUnit.galata] },
      { id: "gwaio_upgrade_flak", units: [gwoUnit.flak] },
      { id: "gwaio_upgrade_pelter", units: [gwoUnit.pelter] },
      { id: "gwaio_upgrade_arkyd", units: [gwoUnit.arkyd] },
      { id: "gwaio_upgrade_stitch", units: [gwoUnit.stitch] },
      { id: "gwaio_upgrade_mend", units: [gwoUnit.mend] },
      { id: "gwaio_upgrade_barnacle", units: [gwoUnit.mend] },
      { id: "gwaio_upgrade_mine", units: [gwoUnit.landMine] },
      { id: "gwaio_upgrade_wall", units: [gwoUnit.wall] },
      { id: "gwaio_upgrade_zeus", units: [gwoUnit.zeus] },
      { id: "gwaio_upgrade_atlas", units: [gwoUnit.atlas] },
      { id: "gwaio_upgrade_helios", units: [gwoUnit.helios] },
      { id: "gwaio_upgrade_ares", units: [gwoUnit.ares] },
      { id: "gwaio_upgrade_solararray", units: [gwoUnit.solarArray] },
      {
        id: "gwaio_upgrade_fabricationbot",
        units: gwoGroup.starterUnitsAdvanced.concat(gwoUnit.botFabber),
      },
      {
        id: "gwaio_upgrade_fabricationvehicle",
        units: gwoGroup.starterUnitsAdvanced.concat(gwoUnit.vehicleFabber),
      },
      {
        id: "gwaio_upgrade_fabricationaircraft",
        units: gwoGroup.starterUnitsAdvanced.concat(gwoUnit.airFabber),
      },
      {
        id: "gwaio_upgrade_fabricationship",
        units: gwoGroup.starterUnitsAdvanced.concat(gwoUnit.navalFabber),
      },
      {
        id: "gwaio_upgrade_advancedfabricationaircraft",
        units: [gwoUnit.airFabberAdvanced],
      },
      {
        id: "gwaio_upgrade_advancedfabricationbot",
        units: [gwoUnit.botFabberAdvanced],
      },
      {
        id: "gwaio_upgrade_advancedfabricationvehicle",
        units: [gwoUnit.vehicleFabberAdvanced],
      },
      {
        id: "gwaio_upgrade_advancedfabricationship",
        units: [gwoUnit.navalFabberAdvanced],
      },
      {
        id: "gwaio_upgrade_orbitalfabricationbot",
        units: [gwoUnit.orbitalFabber],
      },
      { id: "gwaio_upgrade_artemis", units: [gwoUnit.artemis] },
      { id: "gwaio_upgrade_avenger", units: [gwoUnit.avenger] },
      { id: "gwaio_upgrade_anchor", units: [gwoUnit.anchor] },
      { id: "gwaio_upgrade_energyplant", units: [gwoUnit.energyPlant] },
      { id: "gwaio_upgrade_metalextractor", units: [gwoUnit.metalExtractor] },
      {
        id: "gwaio_upgrade_advancedmetalextractor",
        units: [gwoUnit.metalExtractorAdvanced],
      },
      {
        id: "gwaio_upgrade_advancedenergyplant",
        units: [gwoUnit.energyPlantAdvanced],
      },
      {
        id: "gwaio_upgrade_advancedairfactory",
        units: [gwoUnit.airFactoryAdvanced],
      },
      {
        id: "gwaio_upgrade_advancedbotfactory",
        units: [gwoUnit.botFactoryAdvanced],
      },
      {
        id: "gwaio_upgrade_advancednavalfactory",
        units: [gwoUnit.navalFactoryAdvanced],
      },
      {
        id: "gwaio_upgrade_advancedvehiclefactory",
        units: [gwoUnit.vehicleFactoryAdvanced],
      },
      { id: "gwaio_upgrade_orbitalfactory", units: [gwoUnit.orbitalFactory] },
      {
        id: "gwaio_enable_planetaryradar",
        units: [gwoUnit.deepSpaceOrbitalRadar],
      },
      {
        id: "gwaio_upgrade_planetaryradar",
        units: [gwoUnit.deepSpaceOrbitalRadar],
      },
      { id: "gwaio_upgrade_subcommander_duplication" },
      { id: "gwaio_upgrade_subcommander_fabber" },
      { id: "gwaio_upgrade_subcommander_tactics" },
      { id: "gwaio_health_titans", units: gwoGroup.titans },
      { id: "gwaio_damage_titans", units: gwoGroup.titans },
      { id: "gwaio_speed_titans", units: gwoGroup.titans },
      { id: "gwaio_combat_titans", units: gwoGroup.titans },
      { id: "gwaio_cooldown_vehicles", units: vehicleFactories },
      { id: "gwaio_cooldown_bots", units: botFactories },
      { id: "gwaio_cooldown_air", units: airFactories },
      { id: "gwaio_speed_structure", units: mobileStructures },
    ],
  };
});
