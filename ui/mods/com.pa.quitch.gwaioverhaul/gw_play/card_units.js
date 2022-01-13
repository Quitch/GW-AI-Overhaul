define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwaioUnits, gwaioGroups) {
  return {
    cards: [
      { id: "gwaio_enable_bot_aa" },
      { id: "gwc_add_card_slot" },
      {
        id: "gwc_bld_efficiency_cdr",
        units: [gwaioUnits.commander],
      },
      {
        id: "gwc_bld_efficiency_fabs",
        units: gwaioGroups.fabbers.concat(gwaioGroups.factories),
      },
      {
        id: "gwc_combat_air",
        units: gwaioGroups.airMobile,
      },
      {
        id: "gwc_combat_bots",
        units: gwaioGroups.botsMobile,
      },
      {
        id: "gwc_combat_commander",
        units: [gwaioUnits.commander],
      },
      {
        id: "gwc_combat_orbital",
        units: gwaioGroups.orbitalMobile,
      },
      {
        id: "gwc_combat_sea",
        units: gwaioGroups.navalMobile,
      },
      {
        id: "gwc_combat_structures",
        units: gwaioGroups.structures,
      },
      {
        id: "gwc_combat_vehicles",
        units: gwaioGroups.vehiclesMobile,
      },
      {
        id: "gwc_cost_air",
        units: gwaioGroups.airMobile,
      },
      {
        id: "gwc_cost_artillery",
        units: gwaioGroups.structuresArtillery,
      },
      {
        id: "gwc_cost_bots",
        units: gwaioGroups.botsMobile,
      },
      {
        id: "gwc_cost_defenses",
        units: gwaioGroups.structuresDefences,
      },
      {
        id: "gwc_cost_economy",
        units: gwaioGroups.structuresEco,
      },
      {
        id: "gwc_cost_intel",
        units: gwaioGroups.energyUnits,
      },
      {
        id: "gwc_cost_orbital",
        units: gwaioGroups.orbitalMobile,
      },
      {
        id: "gwc_cost_sea",
        units: gwaioGroups.navalMobile,
      },
      {
        id: "gwc_cost_super_weapons",
        units: gwaioGroups.structuresSuperWeapons,
      },
      {
        id: "gwc_cost_titans",
        units: gwaioGroups.titans,
      },
      {
        id: "gwc_cost_vehicles",
        units: gwaioGroups.vehiclesMobile,
      },
      {
        id: "gwc_damage_air",
        units: gwaioGroups.airMobile,
      },
      {
        id: "gwc_damage_artillery",
        units: gwaioGroups.structuresArtillery,
      },
      {
        id: "gwc_damage_bots",
        units: [
          gwaioUnits.bluehawk,
          gwaioUnits.boom,
          gwaioUnits.colonel,
          gwaioUnits.dox,
          gwaioUnits.gilE,
          gwaioUnits.locusts,
          gwaioUnits.slammer,
          gwaioUnits.spark,
          gwaioUnits.stinger,
        ],
      },
      {
        id: "gwc_damage_commander",
        units: [gwaioUnits.commander],
      },
      {
        id: "gwc_damage_defenses",
        units: [
          gwaioUnits.anchor,
          gwaioUnits.catapult,
          gwaioUnits.flak,
          gwaioUnits.galata,
          gwaioUnits.landMine,
          gwaioUnits.laserDefenseTower,
          gwaioUnits.laserDefenseTowerAdvanced,
          gwaioUnits.singleLaserDefenseTower,
          gwaioUnits.torpedoLauncher,
          gwaioUnits.torpedoLauncherAdvanced,
          gwaioUnits.umbrella,
        ],
      },
      {
        id: "gwc_damage_orbital",
        units: [
          gwaioUnits.anchor,
          gwaioUnits.artemis,
          gwaioUnits.avenger,
          gwaioUnits.omega,
          gwaioUnits.sxx,
        ],
      },
      {
        id: "gwc_damage_sea",
        units: [
          gwaioUnits.barracuda,
          gwaioUnits.kaiju,
          gwaioUnits.kraken,
          gwaioUnits.leviathan,
          gwaioUnits.narwhal,
          gwaioUnits.orca,
          gwaioUnits.piranha,
          gwaioUnits.squall,
          gwaioUnits.stingray,
        ],
      },
      {
        id: "gwc_damage_vehicles",
        units: [
          gwaioUnits.ant,
          gwaioUnits.drifter,
          gwaioUnits.inferno,
          gwaioUnits.leveler,
          gwaioUnits.skitter,
          gwaioUnits.spinner,
          gwaioUnits.storm,
          gwaioUnits.vanguard,
        ],
      },
      {
        id: "gwc_enable_air_all",
        units: gwaioGroups.air,
      },
      {
        id: "gwc_enable_air_t1",
        units: gwaioGroups.airBasic,
      },
      {
        id: "gwc_enable_air_t2", // not used
        units: gwaioGroups.airAdvanced,
      },
      {
        id: "gwc_enable_artillery",
        units: gwaioGroups.structuresArtillery,
      },
      {
        id: "gwc_enable_bots_all",
        units: gwaioGroups.bot,
      },
      {
        id: "gwc_enable_bots_t1",
        units: gwaioGroups.botsBasic,
      },
      {
        id: "gwc_enable_bots_t2", // not used
        units: gwaioGroups.botsAdvanced,
      },
      {
        id: "gwc_enable_defenses_t2",
        units: [
          gwaioUnits.catapult,
          gwaioUnits.flak,
          gwaioUnits.laserDefenseTowerAdvanced,
          gwaioUnits.torpedoLauncherAdvanced,
        ],
      },
      {
        id: "gwc_enable_orbital_all",
        units: gwaioGroups.orbitalAdvanced, // basic starts unlocked
      },
      {
        id: "gwc_enable_orbital_t1", // not used
        units: gwaioGroups.orbitalBasic,
      },
      {
        id: "gwc_enable_orbital_t2", // not used
        units: gwaioGroups.orbitalAdvanced,
      },
      {
        id: "gwc_enable_sea_all",
        units: gwaioGroups.navalAdvanced, // basic starts unlocked
      },
      {
        id: "gwc_enable_sea_t1", // not used
        units: gwaioGroups.navalBasic,
      },
      {
        id: "gwc_enable_sea_t2", // not used
        units: gwaioGroups.navalAdvanced,
      },
      {
        id: "gwc_enable_super_weapons", // not used
        units: gwaioGroups.structuresSuperWeapons,
      },
      {
        id: "gwc_enable_titans",
        units: gwaioGroups.titans,
      },
      {
        id: "gwc_enable_vehicles_all",
        units: gwaioGroups.vehicles,
      },
      {
        id: "gwc_enable_vehicles_t1",
        units: gwaioGroups.vehiclesBasic,
      },
      {
        id: "gwc_enable_vehicles_t2", // not used
        units: gwaioGroups.vehiclesAdvanced,
      },
      {
        id: "gwc_energy_efficiency_all",
        units: gwaioGroups.energyAll,
      },
      {
        id: "gwc_energy_efficiency_intel",
        units: gwaioGroups.energyIntel,
      },
      {
        id: "gwc_energy_efficiency_weapons",
        units: gwaioGroups.energyUnits,
      },
      {
        id: "gwc_health_air",
        units: gwaioGroups.airMobile,
      },
      {
        id: "gwc_health_bots",
        units: gwaioGroups.botsMobile,
      },
      {
        id: "gwc_health_commander",
        units: [gwaioUnits.commander],
      },
      {
        id: "gwc_health_orbital",
        units: gwaioGroups.orbitalMobile,
      },
      {
        id: "gwc_health_sea",
        units: gwaioGroups.navalMobile,
      },
      {
        id: "gwc_health_structures",
        units: gwaioGroups.structures,
      },
      {
        id: "gwc_health_vehicles",
        units: gwaioGroups.vehiclesMobile,
      },
      { id: "gwc_minion" },
      {
        id: "gwc_speed_air",
        units: gwaioGroups.airMobile,
      },
      {
        id: "gwc_speed_bots",
        units: gwaioGroups.botsMobile,
      },
      {
        id: "gwc_speed_commander",
        units: [gwaioUnits.commander],
      },
      {
        id: "gwc_speed_orbital",
        units: gwaioGroups.orbitalMobile,
      },
      {
        id: "gwc_speed_sea",
        units: gwaioGroups.navalMobile,
      },
      {
        id: "gwc_speed_vehicles",
        units: gwaioGroups.vehiclesMobile,
      },
      {
        id: "gwc_storage_1",
        units: gwaioGroups.structuresEcoStorage.concat(gwaioUnits.commander),
      },
      {
        id: "gwc_storage_and_buff",
        units: gwaioGroups.structuresEco.concat(
          // don't use storage group so as to avoid a duplicate Jig
          gwaioUnits.energyStorage,
          gwaioUnits.metalStorage
        ),
      },
      {
        id: "gwaio_upgrade_wyrm",
        units: [gwaioUnits.wyrm],
      },
      {
        id: "gwaio_upgrade_ubercannon_structure",
        units: [gwaioUnits.commander],
      },
      {
        id: "gwaio_upgrade_omega",
        units: [gwaioUnits.omega],
      },
      {
        id: "gwaio_upgrade_lob",
        units: [gwaioUnits.lob],
      },
      {
        id: "gwaio_upgrade_dox",
        units: [gwaioUnits.dox],
      },
      {
        id: "gwaio_upgrade_gile",
        units: [gwaioUnits.gilE],
      },
      {
        id: "gwaio_upgrade_kaiju",
        units: [gwaioUnits.kaiju],
      },
      {
        id: "gwaio_upgrade_skitter",
        units: [gwaioUnits.skitter],
      },
      {
        id: "gwaio_upgrade_leveler",
        units: [gwaioUnits.leveler],
      },
      {
        id: "gwaio_upgrade_nukes",
        units: [gwaioUnits.nukeLauncher],
      },
      {
        id: "gwaio_upgrade_firefly",
        units: [gwaioUnits.firefly],
      },
      {
        id: "gwaio_upgrade_hummingbird",
        units: [gwaioUnits.hummingbird],
      },
      {
        id: "gwaio_upgrade_angel",
        units: [gwaioUnits.angel],
      },
      {
        id: "gwaio_upgrade_narwhal",
        units: [gwaioUnits.narwhal],
      },
      {
        id: "gwaio_upgrade_teleporter",
        units: [gwaioUnits.teleporter],
      },
      {
        id: "gwaio_upgrade_singlelaserdefensetower",
        units: [gwaioUnits.singleLaserDefenseTower],
      },
      {
        id: "gwaio_upgrade_astraeus",
        units: [gwaioUnits.astraeus],
      },
      {
        id: "gwaio_upgrade_sxx",
        units: [gwaioUnits.sxx],
      },
      {
        id: "gwaio_upgrade_jig",
        units: [gwaioUnits.jig],
      },
      {
        id: "gwaio_upgrade_energystorage",
        units: [gwaioUnits.energyStorage],
      },
      {
        id: "gwaio_upgrade_metalstorage",
        units: [gwaioUnits.metalStorage],
      },
      {
        id: "gwaio_upgrade_icarus",
        units: [gwaioUnits.icarus],
      },
      {
        id: "gwaio_upgrade_phoenix",
        units: [gwaioUnits.phoenix],
      },
      {
        id: "gwaio_upgrade_leviathan",
        units: [gwaioUnits.leviathan],
      },
      {
        id: "gwaio_upgrade_orca",
        units: [gwaioUnits.orca],
      },
      {
        id: "gwaio_upgrade_piranha",
        units: [gwaioUnits.piranha],
      },
      {
        id: "gwaio_upgrade_horsefly",
        units: [gwaioUnits.horsefly],
      },
      {
        id: "gwaio_upgrade_hornet",
        units: [gwaioUnits.hornet],
      },
      {
        id: "gwaio_upgrade_pelican",
        units: [gwaioUnits.pelican],
      },
      {
        id: "gwaio_upgrade_grenadier",
        units: [gwaioUnits.grenadier],
      },
      {
        id: "gwaio_upgrade_boom",
        units: [gwaioUnits.boom],
      },
      {
        id: "gwaio_upgrade_holkins",
        units: [gwaioUnits.holkins],
      },
      {
        id: "gwaio_upgrade_manhattan",
        units: [gwaioUnits.manhattan],
      },
      {
        id: "gwaio_upgrade_colonel",
        units: [gwaioUnits.colonel],
      },
      {
        id: "gwaio_upgrade_vanguard",
        units: [gwaioUnits.vanguard],
      },
      {
        id: "gwaio_upgrade_torpedolauncher",
        units: [gwaioUnits.torpedoLauncher],
      },
      {
        id: "gwaio_upgrade_advancedtorpedolauncher",
        units: [gwaioUnits.torpedoLauncherAdvanced],
      },
      {
        id: "gwaio_upgrade_catalyst",
        units: [gwaioUnits.catalyst],
      },
      {
        id: "gwaio_upgrade_halley",
        units: [gwaioUnits.halley],
      },
      {
        id: "gwaio_upgrade_ragnarok",
        units: [gwaioUnits.ragnarok],
      },
      {
        id: "gwaio_upgrade_radar",
        units: [gwaioUnits.radar],
      },
      {
        id: "gwaio_upgrade_advancedradar",
        units: [gwaioUnits.radarAdvanced],
      },
      {
        id: "gwaio_upgrade_laserdefensetower",
        units: [gwaioUnits.laserDefenseTower],
      },
      {
        id: "gwaio_upgrade_antinuke",
        units: [gwaioUnits.antiNukeLauncher],
      },
      {
        id: "gwaio_upgrade_squall",
        units: [gwaioUnits.squall],
      },
      {
        id: "gwaio_upgrade_typhoon",
        units: [gwaioUnits.typhoon],
      },
      {
        id: "gwaio_upgrade_inferno",
        units: [gwaioUnits.inferno],
      },
      {
        id: "gwaio_upgrade_sheller",
        units: [gwaioUnits.sheller],
      },
      {
        id: "gwaio_upgrade_bumblebee",
        units: [gwaioUnits.bumblebee],
      },
      {
        id: "gwaio_upgrade_kestrel",
        units: [gwaioUnits.kestrel],
      },
      {
        id: "gwaio_upgrade_spark",
        units: [gwaioUnits.spark],
      },
      {
        id: "gwaio_upgrade_stinger",
        units: [gwaioUnits.stinger],
      },
      {
        id: "gwaio_upgrade_bluehawk",
        units: [gwaioUnits.bluehawk],
      },
      {
        id: "gwaio_upgrade_locusts",
        units: [gwaioUnits.locusts],
      },
      {
        id: "gwaio_upgrade_slammer",
        units: [gwaioUnits.slammer],
      },
      {
        id: "gwaio_upgrade_ant",
        units: [gwaioUnits.ant],
      },
      {
        id: "gwaio_upgrade_spinner",
        units: [gwaioUnits.spinner],
      },
      {
        id: "gwaio_upgrade_storm",
        units: [gwaioUnits.storm],
      },
      {
        id: "gwaio_upgrade_drifter",
        units: [gwaioUnits.drifter],
      },
      {
        id: "gwaio_upgrade_stryker",
        units: [gwaioUnits.stryker],
      },
      {
        id: "gwaio_upgrade_barracuda",
        units: [gwaioUnits.barracuda],
      },
      {
        id: "gwaio_upgrade_stingray",
        units: [gwaioUnits.stingray],
      },
      {
        id: "gwaio_upgrade_kraken",
        units: [gwaioUnits.kraken],
      },
      {
        id: "gwaio_upgrade_advancedlaserdefensetower",
        units: [gwaioUnits.laserDefenseTowerAdvanced],
      },
      {
        id: "gwaio_upgrade_catapult",
        units: [gwaioUnits.catapult],
      },
      {
        id: "gwaio_upgrade_airfactory",
        units: [gwaioUnits.airFactory],
      },
      {
        id: "gwaio_upgrade_botfactory",
        units: [gwaioUnits.botFactory],
      },
      {
        id: "gwaio_upgrade_navalfactory",
        units: [gwaioUnits.navalFactory],
      },
      {
        id: "gwaio_upgrade_orbitallauncher",
        units: [gwaioUnits.orbitalLauncher],
      },
      {
        id: "gwaio_upgrade_unitcannon",
        units: [gwaioUnits.unitCannon],
      },
      {
        id: "gwaio_upgrade_vehiclefactory",
        units: [gwaioUnits.vehicleFactory],
      },
      {
        id: "gwaio_upgrade_hermes",
        units: [gwaioUnits.hermes],
      },
      {
        id: "gwaio_upgrade_advancedradarsatellite",
        units: [gwaioUnits.radarSatelliteAdvanced],
      },
      {
        id: "gwaio_upgrade_umbrella",
        units: [gwaioUnits.umbrella],
      },
      {
        id: "gwaio_upgrade_galata",
        units: [gwaioUnits.galata],
      },
      {
        id: "gwaio_upgrade_flak",
        units: [gwaioUnits.flak],
      },
      {
        id: "gwaio_upgrade_pelter",
        units: [gwaioUnits.pelter],
      },
      {
        id: "gwaio_upgrade_arkyd",
        units: [gwaioUnits.arkyd],
      },
      {
        id: "gwaio_upgrade_stitch",
        units: [gwaioUnits.stitch],
      },
      {
        id: "gwaio_upgrade_mend",
        units: [gwaioUnits.mend],
      },
      {
        id: "gwaio_upgrade_barnacle",
        units: [gwaioUnits.mend],
      },
      {
        id: "gwaio_upgrade_mine",
        units: [gwaioUnits.landMine],
      },
      {
        id: "gwaio_upgrade_wall",
        units: [gwaioUnits.wall],
      },
      {
        id: "gwaio_upgrade_zeus",
        units: [gwaioUnits.zeus],
      },
      {
        id: "gwaio_upgrade_atlas",
        units: [gwaioUnits.atlas],
      },
      {
        id: "gwaio_upgrade_helios",
        units: [gwaioUnits.helios],
      },
      {
        id: "gwaio_upgrade_ares",
        units: [gwaioUnits.ares],
      },
      {
        id: "gwaio_upgrade_solararray",
        units: [gwaioUnits.solarArray],
      },
      {
        id: "gwaio_upgrade_fabricationbot",
        units: [gwaioUnits.botFabber],
      },
      {
        id: "gwaio_upgrade_fabricationvehicle",
        units: [gwaioUnits.vehicleFabber],
      },
      {
        id: "gwaio_upgrade_fabricationaircraft",
        units: [gwaioUnits.airFabber],
      },
      {
        id: "gwaio_upgrade_fabricationship",
        units: [gwaioUnits.navalFabber],
      },
      {
        id: "gwaio_upgrade_advancedfabricationaircraft",
        units: [gwaioUnits.airFabberAdvanced],
      },
      {
        id: "gwaio_upgrade_advancedfabricationbot",
        units: [gwaioUnits.botFabberAdvanced],
      },
      {
        id: "gwaio_upgrade_advancedfabricationvehicle",
        units: [gwaioUnits.vehicleFabberAdvanced],
      },
      {
        id: "gwaio_upgrade_advancedfabricationship",
        units: [gwaioUnits.navalFabberAdvanced],
      },
      {
        id: "gwaio_upgrade_orbitalfabricationbot",
        units: [gwaioUnits.orbitalFabber],
      },
      {
        id: "gwaio_upgrade_artemis",
        units: [gwaioUnits.artemis],
      },
      {
        id: "gwaio_upgrade_avenger",
        units: [gwaioUnits.avenger],
      },
      {
        id: "gwaio_upgrade_anchor",
        units: [gwaioUnits.anchor],
      },
      {
        id: "gwaio_upgrade_energyplant",
        units: [gwaioUnits.energyPlant],
      },
      {
        id: "gwaio_upgrade_metalextractor",
        units: [gwaioUnits.metalExtractor],
      },
      {
        id: "gwaio_upgrade_advancedmetalextractor",
        units: [gwaioUnits.metalExtractorAdvanced],
      },
      {
        id: "gwaio_upgrade_advancedenergyplant",
        units: [gwaioUnits.energyPlantAdvanced],
      },
      {
        id: "gwaio_upgrade_advancedairfactory",
        units: [gwaioUnits.airFactoryAdvanced],
      },
      {
        id: "gwaio_upgrade_advancedbotfactory",
        units: [gwaioUnits.botFactoryAdvanced],
      },
      {
        id: "gwaio_upgrade_advancednavalfactory",
        units: [gwaioUnits.navalFactoryAdvanced],
      },
      {
        id: "gwaio_upgrade_advancedvehiclefactory",
        units: [gwaioUnits.vehicleFactoryAdvanced],
      },
      {
        id: "gwaio_upgrade_orbitalfactory",
        units: [gwaioUnits.orbitalFactory],
      },
      {
        id: "gwaio_enable_planetaryradar",
        units: [gwaioUnits.deepSpaceOrbitalRadar],
      },
      {
        id: "gwaio_upgrade_planetaryradar",
        units: [gwaioUnits.deepSpaceOrbitalRadar],
      },
      {
        id: "gwaio_upgrade_subcommander_duplication",
      },
      {
        id: "gwaio_upgrade_subcommander_fabber",
      },
      {
        id: "gwaio_upgrade_subcommander_tactics",
      },
    ],
  };
});
