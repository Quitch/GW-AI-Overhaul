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
        units: [
          gwaioUnits.airFactoryAdvanced,
          gwaioUnits.airFactory,
          gwaioUnits.airFabberAdvanced,
          gwaioUnits.airFabber,
          gwaioUnits.angel,
          gwaioUnits.antiNukeLauncher,
          gwaioUnits.botFactoryAdvanced,
          gwaioUnits.botFactory,
          gwaioUnits.colonel,
          gwaioUnits.botFabberAdvanced,
          gwaioUnits.mend,
          gwaioUnits.stitch,
          gwaioUnits.botFabber,
          gwaioUnits.vehicleFabberAdvanced,
          gwaioUnits.vehicleFabber,
          gwaioUnits.unitCannon,
          gwaioUnits.vehicleFactoryAdvanced,
          gwaioUnits.vehicleFactory,
          gwaioUnits.orbitalFabber,
          gwaioUnits.orbitalFactory,
          gwaioUnits.orbitalLauncher,
          gwaioUnits.barnacle,
          gwaioUnits.navalFabberAdvanced,
          gwaioUnits.navalFabber,
          gwaioUnits.navalFactoryAdvanced,
          gwaioUnits.navalFactory,
        ],
      },
      {
        id: "gwc_combat_air",
        units: gwaioGroups.mobileAir,
      },
      {
        id: "gwc_combat_bots",
        units: gwaioGroups.mobileBots,
      },
      {
        id: "gwc_combat_commander",
        units: [gwaioUnits.commander],
      },
      {
        id: "gwc_combat_orbital",
        units: gwaioGroups.mobileOrbital,
      },
      {
        id: "gwc_combat_sea",
        units: gwaioGroups.mobileNaval,
      },
      {
        id: "gwc_combat_structures",
        units: gwaioGroups.structures,
      },
      {
        id: "gwc_combat_vehicles",
        units: gwaioGroups.mobileVehicles,
      },
      {
        id: "gwc_cost_air",
        units: gwaioGroups.mobileAir,
      },
      {
        id: "gwc_cost_artillery",
        units: [gwaioUnits.holkins, gwaioUnits.pelter, gwaioUnits.lob],
      },
      {
        id: "gwc_cost_bots",
        units: gwaioGroups.mobileBots,
      },
      {
        id: "gwc_cost_defenses",
        units: [
          gwaioUnits.flak,
          gwaioUnits.galata,
          gwaioUnits.antiNukeLauncher,
          gwaioUnits.wall,
          gwaioUnits.landMine,
          gwaioUnits.laserDefenseTowerAdvanced,
          gwaioUnits.singleLaserDefenseTower,
          gwaioUnits.laserDefenseTower,
          gwaioUnits.catapult,
          gwaioUnits.anchor,
          gwaioUnits.umbrella,
          gwaioUnits.torpedoLauncherAdvanced,
          gwaioUnits.torpedoLauncher,
        ],
      },
      {
        id: "gwc_cost_economy",
        units: [
          gwaioUnits.energyPlantAdvanced,
          gwaioUnits.energyPlant,
          gwaioUnits.energyStorage,
          gwaioUnits.metalExtractorAdvanced,
          gwaioUnits.metalExtractor,
          gwaioUnits.metalStorage,
          gwaioUnits.jig,
        ],
      },
      {
        id: "gwc_cost_intel",
        units: [
          gwaioUnits.radarAdvanced,
          gwaioUnits.radar,
          gwaioUnits.deepSpaceOrbitalRadar,
          gwaioUnits.hermes,
          gwaioUnits.radarSatelliteAdvanced,
          gwaioUnits.arkyd,
        ],
      },
      {
        id: "gwc_cost_orbital",
        units: gwaioGroups.mobileOrbital,
      },
      {
        id: "gwc_cost_sea",
        units: gwaioGroups.mobileNaval,
      },
      {
        id: "gwc_cost_super_weapons",
        units: [
          gwaioUnits.catalyst,
          gwaioUnits.nukeLauncher,
          gwaioUnits.halley,
        ],
      },
      {
        id: "gwc_cost_titans",
        units: [
          gwaioUnits.zeus,
          gwaioUnits.atlas,
          gwaioUnits.ragnarok,
          gwaioUnits.ares,
          gwaioUnits.helios,
        ],
      },
      {
        id: "gwc_cost_vehicles",
        units: gwaioGroups.mobileVehicles,
      },
      {
        id: "gwc_damage_air",
        units: [
          gwaioUnits.hornet,
          gwaioUnits.wyrm,
          gwaioUnits.bumblebee,
          gwaioUnits.hummingbird,
          gwaioUnits.phoenix,
          gwaioUnits.kestrel,
          gwaioUnits.icarus,
          gwaioUnits.horsefly,
        ],
      },
      {
        id: "gwc_damage_artillery",
        units: [gwaioUnits.holkins, gwaioUnits.pelter, gwaioUnits.lob],
      },
      {
        id: "gwc_damage_bots",
        units: [
          gwaioUnits.slammer,
          gwaioUnits.dox,
          gwaioUnits.stinger,
          gwaioUnits.boom,
          gwaioUnits.locusts,
          gwaioUnits.gilE,
          gwaioUnits.colonel,
          gwaioUnits.bluehawk,
          gwaioUnits.spark,
        ],
      },
      {
        id: "gwc_damage_commander",
        units: [gwaioUnits.commander],
      },
      {
        id: "gwc_damage_defenses",
        units: [
          gwaioUnits.flak,
          gwaioUnits.galata,
          gwaioUnits.landMine,
          gwaioUnits.laserDefenseTowerAdvanced,
          gwaioUnits.singleLaserDefenseTower,
          gwaioUnits.laserDefenseTower,
          gwaioUnits.catapult,
          gwaioUnits.anchor,
          gwaioUnits.umbrella,
          gwaioUnits.torpedoLauncherAdvanced,
          gwaioUnits.torpedoLauncher,
        ],
      },
      {
        id: "gwc_damage_orbital",
        units: [
          gwaioUnits.anchor,
          gwaioUnits.omega,
          gwaioUnits.avenger,
          gwaioUnits.sxx,
          gwaioUnits.artemis,
        ],
      },
      {
        id: "gwc_damage_sea",
        units: [
          gwaioUnits.barracuda,
          gwaioUnits.leviathan,
          gwaioUnits.orca,
          gwaioUnits.squall,
          gwaioUnits.narwhal,
          gwaioUnits.kaiju,
          gwaioUnits.stingray,
          gwaioUnits.kraken,
          gwaioUnits.piranha,
        ],
      },
      {
        id: "gwc_damage_vehicles",
        units: [
          gwaioUnits.spinner,
          gwaioUnits.skitter,
          gwaioUnits.inferno,
          gwaioUnits.storm,
          gwaioUnits.vanguard,
          gwaioUnits.drifter,
          gwaioUnits.leveler,
          gwaioUnits.ant,
        ],
      },
      /* We take some liberties with the active gwc_enable_ cards, due to them working counterintuitively.
       They will list units that start unlocked in gwc_start.js, but the player doesn't know this.
       This could also mean if a mod changes how these cards work these listings become inaccurate. */
      {
        id: "gwc_enable_air_all",
        units: [
          gwaioUnits.airFactoryAdvanced,
          gwaioUnits.airFactory,
          gwaioUnits.firefly,
          gwaioUnits.hornet,
          gwaioUnits.wyrm,
          gwaioUnits.bumblebee,
          gwaioUnits.airFabberAdvanced,
          gwaioUnits.airFabber,
          gwaioUnits.phoenix,
          gwaioUnits.hummingbird,
          gwaioUnits.kestrel,
          gwaioUnits.icarus,
          gwaioUnits.horsefly,
          gwaioUnits.angel,
          gwaioUnits.pelican,
        ],
      },
      {
        id: "gwc_enable_air_t1",
        units: [
          gwaioUnits.airFactory,
          gwaioUnits.firefly,
          gwaioUnits.bumblebee,
          gwaioUnits.airFabber,
          gwaioUnits.hummingbird,
          gwaioUnits.icarus,
          gwaioUnits.pelican,
        ],
      },
      {
        id: "gwc_enable_air_t2", // not used
        units: [
          gwaioUnits.airFactoryAdvanced,
          gwaioUnits.airFactory,
          gwaioUnits.airFabber,
        ],
      },
      {
        id: "gwc_enable_artillery",
        units: [gwaioUnits.holkins, gwaioUnits.pelter, gwaioUnits.lob],
      },
      {
        id: "gwc_enable_bots_all",
        units: [
          gwaioUnits.slammer,
          gwaioUnits.dox,
          gwaioUnits.boom,
          gwaioUnits.botFactoryAdvanced,
          gwaioUnits.botFactory,
          gwaioUnits.grenadier,
          gwaioUnits.locusts,
          gwaioUnits.colonel,
          gwaioUnits.bluehawk,
          gwaioUnits.spark,
          gwaioUnits.botFabberAdvanced,
          gwaioUnits.mend,
          gwaioUnits.stitch,
          gwaioUnits.botFabber,
        ],
      },
      {
        id: "gwc_enable_bots_t1",
        units: [
          gwaioUnits.dox,
          gwaioUnits.boom,
          gwaioUnits.botFactory,
          gwaioUnits.grenadier,
          gwaioUnits.spark,
          gwaioUnits.stitch,
          gwaioUnits.botFabber,
        ],
      },
      {
        id: "gwc_enable_bots_t2", // not used
        units: [
          gwaioUnits.botFactoryAdvanced,
          gwaioUnits.botFactory,
          gwaioUnits.botFabber,
        ],
      },
      {
        id: "gwc_enable_defenses_t2",
        units: [
          gwaioUnits.laserDefenseTowerAdvanced,
          gwaioUnits.catapult,
          gwaioUnits.flak,
        ],
      },
      {
        id: "gwc_enable_orbital_all",
        units: [
          gwaioUnits.jig,
          gwaioUnits.omega,
          gwaioUnits.orbitalFactory,
          gwaioUnits.sxx,
          gwaioUnits.artemis,
          gwaioUnits.solarArray,
        ],
      },
      {
        id: "gwc_enable_orbital_t1", // not used
        units: [
          gwaioUnits.avenger,
          gwaioUnits.arkyd,
          gwaioUnits.solarArray,
          gwaioUnits.hermes,
        ],
      },
      {
        id: "gwc_enable_orbital_t2", // not used
        units: [
          gwaioUnits.orbitalFactory,
          gwaioUnits.orbitalFabber,
          gwaioUnits.jig,
        ],
      },
      {
        id: "gwc_enable_sea_all",
        units: [
          gwaioUnits.leviathan,
          gwaioUnits.typhoon,
          gwaioUnits.squall,
          gwaioUnits.navalFabberAdvanced,
          gwaioUnits.kaiju,
          gwaioUnits.stingray,
          gwaioUnits.navalFactoryAdvanced,
          gwaioUnits.kraken,
        ],
      },
      {
        id: "gwc_enable_sea_t1", // not used
        units: [gwaioUnits.navalFactory],
      },
      {
        id: "gwc_enable_sea_t2", // not used
        units: [gwaioUnits.navalFactoryAdvanced],
      },
      {
        id: "gwc_enable_super_weapons", // not used
        units: [
          gwaioUnits.catalyst,
          gwaioUnits.nukeLauncher,
          gwaioUnits.halley,
        ],
      },
      {
        id: "gwc_enable_titans",
        units: [
          gwaioUnits.atlas,
          gwaioUnits.ares,
          gwaioUnits.helios,
          gwaioUnits.ragnarok,
          gwaioUnits.zeus,
        ],
      },
      {
        id: "gwc_enable_vehicles_all",
        units: [
          gwaioUnits.spinner,
          gwaioUnits.stryker,
          gwaioUnits.vehicleFabberAdvanced,
          gwaioUnits.vehicleFabber,
          gwaioUnits.skitter,
          gwaioUnits.inferno,
          gwaioUnits.storm,
          gwaioUnits.vanguard,
          gwaioUnits.sheller,
          gwaioUnits.drifter,
          gwaioUnits.leveler,
          gwaioUnits.ant,
          gwaioUnits.manhattan,
          gwaioUnits.vehicleFactoryAdvanced,
          gwaioUnits.vehicleFactory,
        ],
      },
      {
        id: "gwc_enable_vehicles_t1",
        units: [
          gwaioUnits.spinner,
          gwaioUnits.stryker,
          gwaioUnits.inferno,
          gwaioUnits.drifter,
          gwaioUnits.ant,
          gwaioUnits.vehicleFactory,
        ],
      },
      {
        id: "gwc_enable_vehicles_t2", // not used
        units: [
          gwaioUnits.vehicleFabberAdvanced,
          gwaioUnits.storm,
          gwaioUnits.vanguard,
          gwaioUnits.sheller,
          gwaioUnits.leveler,
          gwaioUnits.manhattan,
          gwaioUnits.vehicleFactoryAdvanced,
        ],
      },
      {
        id: "gwc_energy_efficiency_all",
        units: [
          gwaioUnits.wyrm,
          gwaioUnits.bumblebee,
          gwaioUnits.icarus,
          gwaioUnits.zeus,
          gwaioUnits.commander,
          gwaioUnits.holkins,
          gwaioUnits.pelter,
          gwaioUnits.spark,
          gwaioUnits.radarAdvanced,
          gwaioUnits.radar,
          gwaioUnits.deepSpaceOrbitalRadar,
          gwaioUnits.sxx,
          gwaioUnits.artemis,
          gwaioUnits.radarSatelliteAdvanced,
          gwaioUnits.arkyd,
          gwaioUnits.helios,
        ],
      },
      {
        id: "gwc_energy_efficiency_intel",
        units: [
          gwaioUnits.radarAdvanced,
          gwaioUnits.radar,
          gwaioUnits.deepSpaceOrbitalRadar,
          gwaioUnits.radarSatelliteAdvanced,
          gwaioUnits.arkyd,
        ],
      },
      {
        id: "gwc_energy_efficiency_weapons",
        units: [
          gwaioUnits.wyrm,
          gwaioUnits.bumblebee,
          gwaioUnits.icarus,
          gwaioUnits.zeus,
          gwaioUnits.commander,
          gwaioUnits.holkins,
          gwaioUnits.pelter,
          gwaioUnits.spark,
          gwaioUnits.sxx,
          gwaioUnits.artemis,
          gwaioUnits.helios,
        ],
      },
      {
        id: "gwc_health_air",
        units: gwaioGroups.mobileAir,
      },
      {
        id: "gwc_health_bots",
        units: gwaioGroups.mobileBots,
      },
      {
        id: "gwc_health_commander",
        units: [gwaioUnits.commander],
      },
      {
        id: "gwc_health_orbital",
        units: gwaioGroups.mobileOrbital,
      },
      {
        id: "gwc_health_sea",
        units: gwaioGroups.mobileNaval,
      },
      {
        id: "gwc_health_structures",
        units: gwaioGroups.structures,
      },
      {
        id: "gwc_health_vehicles",
        units: gwaioGroups.mobileVehicles,
      },
      { id: "gwc_minion" },
      {
        id: "gwc_speed_air",
        units: gwaioGroups.mobileAir,
      },
      {
        id: "gwc_speed_bots",
        units: gwaioGroups.mobileBots,
      },
      {
        id: "gwc_speed_commander",
        units: [gwaioUnits.commander],
      },
      {
        id: "gwc_speed_orbital",
        units: gwaioGroups.mobileOrbital,
      },
      {
        id: "gwc_speed_sea",
        units: gwaioGroups.mobileNaval,
      },
      {
        id: "gwc_speed_vehicles",
        units: gwaioGroups.mobileVehicles,
      },
      {
        id: "gwc_storage_1",
        units: [
          gwaioUnits.commander,
          gwaioUnits.energyStorage,
          gwaioUnits.metalStorage,
          gwaioUnits.jig,
        ],
      },
      {
        id: "gwc_storage_and_buff",
        units: [
          gwaioUnits.energyPlantAdvanced,
          gwaioUnits.energyPlant,
          gwaioUnits.metalExtractorAdvanced,
          gwaioUnits.metalExtractor,
          gwaioUnits.jig,
        ],
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
        units: ["/pa/units/sea/drone_carrier/drone.json"],
      },
      {
        id: "gwaio_upgrade_typhoon",
        units: ["/pa/units/sea/drone_carrier/carrier.json"],
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
        units: ["/pa/units/land/bot_tesla/bot_aa.json"],
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
        units: ["/pa/units/land/tank_light_laser/tank_light_laser.json"],
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
