// Legion Expansion as a Galactic War race. Commanders and AI data are what the
// mod ships; the unit table maps GWO's vanilla unit keys to Legion's units so
// the card and tech pipeline can address them. See races.md.
define(function () {
  return {
    id: "legion",
    name: "!LOC:Legion",
    serverMods: [
      "com.pa.legion-expansion-server",
      "com.pa.legion-expansion-server-dev",
    ],
    unitTypeBit: "Custom1",
    commanderTypes: {
      unitType: "UNITTYPE_Custom1",
      buildable: "CmdBuild & Custom1",
    },
    commanders: [
      { spec: "/pa/units/commanders/l_overwatch/l_overwatch.json" },
      { spec: "/pa/units/commanders/l_cyclops/l_cyclops.json" },
      { spec: "/pa/units/commanders/l_cataphract/l_cataphract.json" },
      { spec: "/pa/units/commanders/l_raptor/l_raptor.json" },
      { spec: "/pa/units/commanders/l_quad/l_quad.json" },
      { spec: "/pa/units/commanders/l_tank/l_tank.json" },
    ],
    playerIcon: {
      fill: "coui://ui/mods/com.pa.legion-expansion/img/icon_player_fill_l.png",
      outline:
        "coui://ui/mods/com.pa.legion-expansion/img/icon_player_outline_l.png",
    },
    ai: {
      // Flat legion_* files beside the stock ones, one unit map.
      titans: {
        unitMaps: ["/pa/ai/unit_maps/legion.json"],
        sources: [
          { dir: "/pa/ai/fabber_builds/", match: "legion_" },
          { dir: "/pa/ai/factory_builds/", match: "legion_" },
          { dir: "/pa/ai/platoon_builds/", match: "legion_" },
          { dir: "/pa/ai/platoon_templates/", match: "legion_" },
        ],
      },
      // Queller carries Legion beside MLA in every tier; the tree is the tier
      // minus the MLA side.
      queller: {
        unitMaps: ["unit_maps/legion.json"],
        exclude: ["/mla/", "/unit_maps/mla.json"],
      },
    },
    units: {
      airFabber:
        "/pa/units/air/l_fabrication_aircraft/l_fabrication_aircraft.json",
      airFabberAdvanced:
        "/pa/units/air/l_fabrication_aircraft_adv/l_fabrication_aircraft_adv.json",
      airFabberAdvancedBuildArm:
        "/pa/units/air/l_fabrication_aircraft_adv/l_fabrication_aircraft_adv_build_arm.json",
      airFabberBuildArm:
        "/pa/units/air/l_fabrication_aircraft/l_fabrication_aircraft_build_arm.json",
      airFactory: "/pa/units/air/l_air_factory/l_air_factory.json",
      airFactoryAdvanced:
        "/pa/units/air/l_air_factory_adv/l_air_factory_adv.json",
      airFactoryAdvancedBuildArm:
        "/pa/units/air/l_air_factory_adv/l_air_factory_adv_build_arm.json",
      airFactoryBuildArm:
        "/pa/units/air/l_air_factory/l_air_factory_build_arm.json",
      anchor: "/pa/units/orbital/l_defense_satellite/l_defense_satellite.json",
      anchorAmmoAG:
        "/pa/units/orbital/l_defense_satellite/l_defense_satellite_ammo.json",
      anchorAmmoAO:
        "/pa/units/orbital/l_defense_satellite/l_defense_satellite_ground_ammo.json",
      anchorWeaponAG:
        "/pa/units/orbital/l_defense_satellite/l_defense_satellite_tool_weapon.json",
      anchorWeaponAO:
        "/pa/units/orbital/l_defense_satellite/l_defense_satellite_ground_tool_weapon.json",
      ant: "/pa/units/land/l_tank_shank/l_tank_shank.json",
      antAmmo: "/pa/units/land/l_tank_shank/l_tank_shank_ammo.json",
      antWeapon: "/pa/units/land/l_tank_shank/l_tank_shank_tool_weapon.json",
      antiNukeLauncher:
        "/pa/units/land/l_anti_nuke_launcher/l_anti_nuke_launcher.json",
      antiNukeLauncherAmmo:
        "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher_ammo.json",
      antiNukeLauncherBuildArm:
        "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher_build_arm.json",
      antiNukeWeapon:
        "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher_tool_weapon.json",
      ares: "/pa/units/land/l_titan_vehicle/l_titan_vehicle.json",
      aresAmmo: "/pa/units/land/l_titan_vehicle/l_titan_vehicle_ammo_main.json",
      aresSecondary:
        "/pa/units/land/l_titan_vehicle/l_titan_vehicle_tool_weapon_side.json",
      aresSecondaryAmmo:
        "/pa/units/land/l_titan_vehicle/l_titan_vehicle_ammo_side.json",
      aresWeapon:
        "/pa/units/land/l_titan_vehicle/l_titan_vehicle_tool_weapon_main.json",
      arkyd: "/pa/units/orbital/l_radar_satellite/l_radar_satellite.json",
      artemis: "/pa/units/orbital/l_orbital_railgun/l_orbital_railgun.json",
      artemisAmmo:
        "/pa/units/orbital/l_orbital_railgun/l_orbital_railgun_ammo.json",
      artemisWeapon:
        "/pa/units/orbital/l_orbital_railgun/l_orbital_railgun_tool_weapon.json",
      astraeus: "/pa/units/orbital/l_orbital_lander/l_orbital_lander.json",
      atlas: "/pa/units/land/l_titan_bot/l_titan_bot.json",
      atlasAmmo: "/pa/units/land/l_titan_bot/l_titan_bot_cannon_ammo.json",
      atlasWeapon:
        "/pa/units/land/l_titan_bot/l_titan_bot_cannon_tool_weapon.json",
      avenger: "/pa/units/orbital/l_orbital_fighter/l_orbital_fighter.json",
      avengerAmmo:
        "/pa/units/orbital/l_orbital_fighter/l_orbital_fighter_ammo.json",
      avengerWeapon:
        "/pa/units/orbital/l_orbital_fighter/l_orbital_fighter_tool_weapon.json",
      barnacle:
        "/pa/units/sea/l_fabrication_sub_combat_adv/l_fabrication_sub_combat_adv.json",
      barnacleBuildArm:
        "/pa/units/sea/l_fabrication_sub_combat_adv/l_fabrication_sub_combat_adv_build_arm.json",
      barracuda: "/pa/units/sea/l_attack_sub/l_attack_sub.json",
      barracudaAmmo: "/pa/units/sea/l_attack_sub/l_attack_sub_ammo.json",
      barracudaWeapon:
        "/pa/units/sea/l_attack_sub/l_attack_sub_tool_weapon.json",
      bluehawk: "/pa/units/land/l_bot_artillery_adv/l_bot_artillery_adv.json",
      bluehawkAmmo:
        "/pa/units/land/l_bot_artillery_adv/l_bot_artillery_adv_ammo.json",
      bluehawkAmmoOrbital:
        "/pa/units/land/l_bot_artillery_adv/l_bot_artillery_adv_light_ammo.json",
      bluehawkBeam:
        "/pa/units/land/l_bot_artillery_adv/l_bot_artillery_adv_tool_weapon.json",
      bluehawkBeamAmmo:
        "/pa/units/land/l_bot_artillery_adv/l_bot_artillery_adv_ammo.json",
      bluehawkWeapon:
        "/pa/units/land/l_bot_artillery_adv/l_bot_artillery_adv_tool_weapon.json",
      bluehawkWeaponOrbital:
        "/pa/units/land/l_bot_artillery_adv/l_bot_artillery_adv_light_tool_weapon.json",
      boom: "/pa/units/land/l_bot_bomb/l_bot_bomb.json",
      botFabber: "/pa/units/land/l_fabrication_bot/l_fabrication_bot.json",
      botFabberAdvanced:
        "/pa/units/land/l_fabrication_bot_adv/l_fabrication_bot_adv.json",
      botFabberAdvancedBuildArm:
        "/pa/units/land/l_fabrication_bot_adv/l_fabrication_bot_adv_build_arm.json",
      botFabberBuildArm:
        "/pa/units/land/l_fabrication_bot/l_fabrication_bot_build_arm.json",
      botFactory: "/pa/units/land/l_bot_factory/l_bot_factory.json",
      botFactoryAdvanced:
        "/pa/units/land/l_bot_factory_adv/l_bot_factory_adv.json",
      botFactoryAdvancedBuildArm:
        "/pa/units/land/l_bot_factory_adv/l_bot_factory_adv_build_arm.json",
      botFactoryBuildArm:
        "/pa/units/land/l_bot_factory/l_bot_factory_build_arm.json",
      bumblebee: "/pa/units/air/l_bomber/l_bomber.json",
      bumblebeeAmmo: "/pa/units/air/l_bomber/l_bomber_ammo.json",
      bumblebeeWeapon: "/pa/units/air/l_bomber/l_bomber_tool_weapon.json",
      catalyst: "/pa/units/land/l_control_module/l_control_module.json",
      catapult: "/pa/units/land/l_rocket_barrage/l_rocket_barrage.json",
      catapultAmmo:
        "/pa/units/land/l_rocket_barrage/l_rocket_barrage_ammo.json",
      catapultBeam:
        "/pa/units/land/l_rocket_barrage/l_rocket_barrage_tool_weapon.json",
      catapultBeamAmmo:
        "/pa/units/land/l_rocket_barrage/l_rocket_barrage_ammo.json",
      catapultWeapon:
        "/pa/units/land/l_rocket_barrage/l_rocket_barrage_tool_weapon.json",
      colonel:
        "/pa/units/land/l_bot_support_commander/l_bot_support_commander.json",
      colonelAmmo:
        "/pa/units/land/l_bot_support_commander/l_bot_support_commander_ammo.json",
      colonelBuildArm:
        "/pa/units/land/l_bot_support_commander/l_bot_support_commander_tool_build_arm.json",
      colonelWeapon:
        "/pa/units/land/l_bot_support_commander/l_bot_support_commander_tool_weapon.json",
      commander: "/pa/units/commanders/l_base/l_base.json",
      dox: "/pa/units/land/l_assault_bot/l_assault_bot.json",
      doxWeapon: "/pa/units/land/l_assault_bot/l_assault_bot_tool_weapon.json",
      drifter: "/pa/units/land/l_hover_tank/l_hover_tank.json",
      drifterAmmo: "/pa/units/land/l_hover_tank/l_hover_tank_ammo.json",
      drifterWeapon:
        "/pa/units/land/l_hover_tank/l_hover_tank_tool_weapon.json",
      energyPlant: "/pa/units/land/l_energy_plant/l_energy_plant.json",
      energyPlantAdvanced:
        "/pa/units/land/l_energy_plant_adv/l_energy_plant_adv.json",
      energyStorage: "/pa/units/land/l_storage/l_storage.json",
      firefly: "/pa/units/air/l_raider/l_raider.json",
      flak: "/pa/units/land/l_air_defense_adv/l_air_defense_adv.json",
      flakAmmo: "/pa/units/land/l_air_defense_adv/l_air_defense_adv_ammo.json",
      flakWeapon:
        "/pa/units/land/l_air_defense_adv/l_air_defense_adv_tool_weapon.json",
      galata: "/pa/units/land/l_air_defense/l_air_defense.json",
      galataAmmo: "/pa/units/land/l_air_defense/l_air_defense_ammo.json",
      galataWeapon:
        "/pa/units/land/l_air_defense/l_air_defense_tool_weapon.json",
      gilE: "/pa/units/land/l_sniper_bot/l_sniper_bot.json",
      gilEAmmo: "/pa/units/land/l_sniper_bot/l_sniper_bot_ammo.json",
      gilEBeam: "/pa/units/land/l_sniper_bot/l_sniper_bot_tool_weapon.json",
      gilEBeamAmmo: "/pa/units/land/l_sniper_bot/l_sniper_bot_ammo.json",
      gilEWeapon: "/pa/units/land/l_sniper_bot/l_sniper_bot_tool_weapon.json",
      grenadier: "/pa/units/land/l_bot_artillery/l_bot_artillery.json",
      grenadierAmmo: "/pa/units/land/l_bot_artillery/l_bot_artillery_ammo.json",
      grenadierWeapon:
        "/pa/units/land/l_bot_artillery/l_bot_artillery_tool_weapon.json",
      halley: "/pa/units/orbital/l_delta_v_engine/l_delta_v_engine.json",
      helios: "/pa/units/orbital/l_titan_orbital/l_titan_orbital.json",
      heliosAmmo: "/pa/units/orbital/l_titan_orbital/l_titan_orbital_ammo.json",
      heliosWeapon:
        "/pa/units/orbital/l_titan_orbital/l_titan_orbital_tool_weapon.json",
      hermes: "/pa/units/orbital/l_orbital_probe/l_orbital_probe.json",
      holkins: "/pa/units/land/l_artillery_long/l_artillery_long.json",
      holkinsAmmo: "/pa/units/land/l_artillery_long/l_artillery_long_ammo.json",
      holkinsWeapon:
        "/pa/units/land/l_artillery_long/l_artillery_long_tool_weapon.json",
      hornet: "/pa/units/air/l_firestarter/l_firestarter.json",
      horsefly: "/pa/units/air/l_air_scout_adv/l_air_scout_adv.json",
      horseflyAmmo:
        "/pa/units/air/l_air_scout_adv/l_air_scout_adv_vision_ammo.json",
      horseflyWeapon:
        "/pa/units/air/l_air_scout_adv/l_air_scout_adv_vision_tool_weapon.json",
      hummingbird: "/pa/units/air/l_fighter/l_fighter.json",
      hummingbirdAmmo: "/pa/units/air/l_fighter/l_fighter_ammo.json",
      hummingbirdWeapon: "/pa/units/air/l_fighter/l_fighter_tool_weapon.json",
      inferno: "/pa/units/land/l_shotgun_tank/l_shotgun_tank.json",
      infernoAmmo: "/pa/units/land/l_shotgun_tank/l_shotgun_tank_ammo.json",
      infernoWeapon:
        "/pa/units/land/l_shotgun_tank/l_shotgun_tank_tool_weapon.json",
      jig: "/pa/units/orbital/l_mining_platform/l_mining_platform.json",
      kaiju: "/pa/units/sea/l_hover_ship/l_hover_ship.json",
      kaijuAmmo: "/pa/units/sea/l_hover_ship/l_hover_ship_ammo.json",
      kaijuSecondary:
        "/pa/units/sea/l_hover_ship/l_hover_ship_tool_weapon_side.json",
      kaijuSecondaryAmmo:
        "/pa/units/sea/l_hover_ship/l_hover_ship_ammo_side.json",
      kaijuWeapon: "/pa/units/sea/l_hover_ship/l_hover_ship_tool_weapon.json",
      kestrel: "/pa/units/air/l_gunship/l_gunship.json",
      kestrelAmmo: "/pa/units/air/l_gunship/l_gunship_main_ammo.json",
      kestrelWeapon: "/pa/units/air/l_gunship/l_gunship_main_tool_weapon.json",
      landMine: "/pa/units/land/l_land_mine/l_land_mine.json",
      landMineAmmo: "/pa/units/land/l_land_mine/l_land_mine_trigger_ammo.json",
      landMineWeapon:
        "/pa/units/land/l_land_mine/l_land_mine_trigger_tool_weapon.json",
      laserDefenseTower: "/pa/units/land/l_t1_turret_adv/l_t1_turret_adv.json",
      laserDefenseTowerAdvanced:
        "/pa/units/air/l_firestarter/l_drop_turret/l_drop_turret.json",
      laserDefenseTowerAdvancedAmmo:
        "/pa/units/air/l_firestarter/l_drop_turret/l_drop_turret_ammo.json",
      laserDefenseTowerAdvancedWeapon:
        "/pa/units/air/l_firestarter/l_drop_turret/l_drop_turret_tool_weapon.json",
      laserDefenseTowerAmmo:
        "/pa/units/land/l_t1_turret_adv/l_t1_turret_adv_ammo.json",
      laserDefenseTowerWeapon:
        "/pa/units/land/l_t1_turret_adv/l_t1_turret_adv_tool_weapon.json",
      leveler: "/pa/units/land/l_tank_laser_adv/l_tank_laser_adv.json",
      levelerAmmo: "/pa/units/land/l_tank_laser_adv/l_tank_laser_adv_ammo.json",
      levelerWeapon:
        "/pa/units/land/l_tank_laser_adv/l_tank_laser_adv_tool_weapon.json",
      leviathan: "/pa/units/sea/l_battleship/l_battleship.json",
      leviathanAmmo: "/pa/units/sea/l_battleship/l_battleship_upper_ammo.json",
      leviathanWeapon:
        "/pa/units/sea/l_battleship/l_battleship_upper_tool_weapon.json",
      locusts: "/pa/units/land/l_necromancer/l_necromancer.json",
      locustsAmmo: "/pa/units/land/l_necromancer/l_necromancer_ammo.json",
      locustsWeapon:
        "/pa/units/land/l_necromancer/l_necromancer_tool_weapon.json",
      metalExtractor: "/pa/units/land/l_mex/l_mex.json",
      metalExtractorAdvanced: "/pa/units/land/l_mex_adv/l_mex_adv.json",
      metalStorage: "/pa/units/land/l_storage/l_storage.json",
      narwhal: "/pa/units/sea/l_frigate/l_frigate.json",
      narwhalAA: "/pa/units/sea/l_frigate/l_frigate_tool_weapon_aa.json",
      narwhalAAAmmo: "/pa/units/sea/l_frigate/l_frigate_ammo_aa.json",
      narwhalAmmo: "/pa/units/sea/l_frigate/l_frigate_ammo_aa.json",
      narwhalTorpedo: "/pa/units/sea/l_frigate/l_frigate_tool_weapon_aa.json",
      narwhalTorpedoAmmo: "/pa/units/sea/l_frigate/l_frigate_ammo_aa.json",
      narwhalWeapon: "/pa/units/sea/l_frigate/l_frigate_tool_weapon_aa.json",
      navalFabber: "/pa/units/sea/l_fabrication_ship/l_fabrication_ship.json",
      navalFabberAdvanced:
        "/pa/units/sea/l_fabrication_ship_adv/l_fabrication_ship_adv.json",
      navalFabberAdvancedBuildArm:
        "/pa/units/sea/l_fabrication_ship_adv/l_fabrication_ship_adv_build_arm.json",
      navalFabberBuildArm:
        "/pa/units/sea/l_fabrication_ship/l_fabrication_ship_build_arm.json",
      navalFactory: "/pa/units/sea/l_naval_factory/l_naval_factory.json",
      navalFactoryAdvanced:
        "/pa/units/sea/l_naval_factory_adv/l_naval_factory_adv.json",
      navalFactoryAdvancedBuildArm:
        "/pa/units/sea/l_naval_factory_adv/l_naval_factory_adv_build_arm.json",
      navalFactoryBuildArm:
        "/pa/units/sea/l_naval_factory/l_naval_factory_build_arm.json",
      nukeLauncher: "/pa/units/land/l_nuke_launcher/l_nuke_launcher.json",
      nukeLauncherAmmo:
        "/pa/units/land/l_nuke_launcher/l_nuke_launcher_ammo.json",
      nukeLauncherBuildArm:
        "/pa/units/land/l_nuke_launcher/l_nuke_launcher_build_arm.json",
      nukeLauncherWeapon:
        "/pa/units/land/l_nuke_launcher/l_nuke_launcher_tool_weapon.json",
      nyx: "/pa/units/land/l_sniper_tank/l_sniper_tank.json",
      omega: "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship.json",
      omegaAmmo:
        "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship_ammo.json",
      omegaAmmoAG:
        "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship_ammo_ground.json",
      omegaWeapon:
        "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship_tool_weapon.json",
      omegaWeaponAG:
        "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship_tool_weapon_ground.json",
      orbitalFabber:
        "/pa/units/orbital/l_orbital_fabrication_bot/l_orbital_fabrication_bot.json",
      orbitalFabberBuildArm:
        "/pa/units/orbital/l_orbital_fabrication_bot/l_orbital_fabrication_bot_build_arm.json",
      orbitalFactory:
        "/pa/units/orbital/l_orbital_factory/l_orbital_factory.json",
      orbitalFactoryBuildArm:
        "/pa/units/orbital/l_orbital_factory/l_orbital_factory_build_arm.json",
      orbitalLauncher:
        "/pa/units/orbital/l_orbital_launcher/l_orbital_launcher.json",
      orbitalLauncherBuildArm:
        "/pa/units/orbital/orbital_launcher/orbital_launcher_build_arm.json",
      orca: "/pa/units/sea/l_destroyer/l_destroyer.json",
      orcaAmmo: "/pa/units/sea/l_destroyer/l_destroyer_ammo.json",
      orcaWeapon: "/pa/units/sea/l_destroyer/l_destroyer_tool_weapon.json",
      pelican: "/pa/units/air/l_transport/l_transport.json",
      pelter: "/pa/units/land/l_artillery_short/l_artillery_short.json",
      pelterAmmo:
        "/pa/units/land/l_artillery_short/l_artillery_short_ammo.json",
      pelterWeapon:
        "/pa/units/land/l_artillery_short/l_artillery_short_tool_weapon.json",
      phoenix: "/pa/units/air/l_fighter_adv/l_fighter_adv.json",
      phoenixAmmo: "/pa/units/air/l_fighter_adv/l_fighter_adv_ammo.json",
      phoenixWeapon:
        "/pa/units/air/l_fighter_adv/l_fighter_adv_tool_weapon.json",
      piranha: "/pa/units/sea/l_sea_scout/l_sea_scout.json",
      piranhaAmmo: "/pa/units/sea/l_sea_scout/l_sea_scout_ammo.json",
      piranhaWeapon: "/pa/units/sea/l_sea_scout/l_sea_scout_tool_weapon.json",
      radar: "/pa/units/land/l_radar/l_radar.json",
      radarAdvanced: "/pa/units/land/l_radar_adv/l_radar_adv.json",
      radarSatelliteAdvanced:
        "/pa/units/orbital/l_radar_satellite_adv/l_radar_satellite_adv.json",
      ragnarok: "/pa/units/land/l_titan_structure/l_titan_structure.json",
      ragnarokWeapon:
        "/pa/units/land/titan_structure/titan_structure_tool_weapon.json",
      sheller: "/pa/units/land/l_hover_tank_adv/l_hover_tank_adv.json",
      shellerAmmo: "/pa/units/land/l_hover_tank_adv/l_hover_tank_adv_ammo.json",
      shellerWeapon:
        "/pa/units/land/l_hover_tank_adv/l_hover_tank_adv_tool_weapon.json",
      singleLaserDefenseTower:
        "/pa/units/land/l_t1_turret_basic/l_t1_turret_basic.json",
      singleLaserDefenseTowerAmmo:
        "/pa/units/land/l_t1_turret_basic/l_t1_turret_basic_ammo.json",
      singleLaserDefenseTowerWeapon:
        "/pa/units/land/l_t1_turret_basic/l_t1_turret_basic_tool_weapon.json",
      slammer: "/pa/units/land/l_riot_bot/l_riot_bot.json",
      slammerTorpedo: "/pa/units/land/l_riot_bot/l_riot_bot_tool_weapon.json",
      slammerWeapon: "/pa/units/land/l_riot_bot/l_riot_bot_tool_weapon.json",
      spark: "/pa/units/land/l_bot_aa_adv/l_bot_aa_adv.json",
      sparkAmmo: "/pa/units/land/l_bot_aa_adv/l_bot_aa_adv_ammo.json",
      sparkWeapon: "/pa/units/land/l_bot_aa_adv/l_bot_aa_adv_tool_weapon.json",
      squall: "/pa/units/air/l_air_carrier/l_drone/l_drone.json",
      squallAmmo: "/pa/units/air/l_air_carrier/l_drone/l_drone_death_ammo.json",
      squallTorpedo:
        "/pa/units/air/l_air_carrier/l_drone/l_drone_tool_weapon.json",
      squallWeapon:
        "/pa/units/air/l_air_carrier/l_drone/l_drone_death_tool_weapon.json",
      stinger: "/pa/units/land/l_bot_aa/l_bot_aa.json",
      stingerAmmo: "/pa/units/land/l_bot_aa/l_bot_aa_ammo.json",
      stingerWeapon: "/pa/units/land/l_bot_aa/l_bot_aa_tool_weapon.json",
      stingray: "/pa/units/sea/l_missile_ship/l_missile_ship.json",
      stingrayAA:
        "/pa/units/sea/l_missile_ship/l_missile_ship_beam_tool_weapon.json",
      stingrayAAAmmo:
        "/pa/units/sea/l_missile_ship/l_missile_ship_beam_ammo.json",
      stingrayAmmo:
        "/pa/units/sea/l_missile_ship/l_missile_ship_rocket_ammo.json",
      stingrayBeam:
        "/pa/units/sea/l_missile_ship/l_missile_ship_beam_tool_weapon.json",
      stingrayBeamAmmo:
        "/pa/units/sea/l_missile_ship/l_missile_ship_beam_ammo.json",
      stingrayWeapon:
        "/pa/units/sea/l_missile_ship/l_missile_ship_rocket_tool_weapon.json",
      stitch:
        "/pa/units/land/l_fabrication_vehicle_combat/l_fabrication_vehicle_combat.json",
      stitchBuildArm:
        "/pa/units/land/l_fabrication_vehicle_combat/l_fabrication_vehicle_combat_build_arm.json",
      storm: "/pa/units/land/l_tank_swarm/l_tank_swarm.json",
      stormAmmo: "/pa/units/land/l_tank_swarm/l_tank_swarm_ammo.json",
      stormWeapon: "/pa/units/land/l_tank_swarm/l_tank_swarm_tool_weapon.json",
      stryker: "/pa/units/land/l_mortar_tank/l_mortar_tank.json",
      strykerAmmo:
        "/pa/units/land/l_mortar_tank/l_mortar_tank_torpedo_water_ammo.json",
      strykerWeapon:
        "/pa/units/land/l_mortar_tank/l_mortar_tank_torpedo_tool_weapon.json",
      sxx: "/pa/units/orbital/l_orbital_laser/l_orbital_laser.json",
      sxxAmmo: "/pa/units/orbital/l_orbital_laser/l_orbital_laser_ammo.json",
      sxxWeapon:
        "/pa/units/orbital/l_orbital_laser/l_orbital_laser_tool_weapon.json",
      teleporter: "/pa/units/land/l_teleporter/l_teleporter.json",
      torpedoLauncher:
        "/pa/units/sea/l_torpedo_launcher/l_torpedo_launcher.json",
      torpedoLauncherAdvanced:
        "/pa/units/sea/l_torpedo_launcher_adv/l_torpedo_launcher_adv.json",
      torpedoLauncherAdvancedWeapon:
        "/pa/units/sea/l_torpedo_launcher_adv/l_torpedo_launcher_adv_wave_tool_weapon.json",
      torpedoLauncherWeapon:
        "/pa/units/sea/l_torpedo_launcher/l_torpedo_launcher_wave_tool_weapon.json",
      typhoon: "/pa/units/sea/l_sea_tank/l_sea_tank.json",
      typhoonAmmo: "/pa/units/sea/l_sea_tank/l_sea_tank_ammo.json",
      typhoonWeapon: "/pa/units/sea/l_sea_tank/l_sea_tank_tool_weapon.json",
      umbrella: "/pa/units/orbital/l_ion_defense/l_ion_defense.json",
      umbrellaAmmo: "/pa/units/orbital/l_ion_defense/l_ion_defense_ammo.json",
      umbrellaBeam:
        "/pa/units/orbital/l_ion_defense/l_ion_defense_tool_antidrop.json",
      umbrellaBeamAmmo:
        "/pa/units/orbital/l_ion_defense/l_ion_defense_antidrop_ammo.json",
      umbrellaWeapon:
        "/pa/units/orbital/l_ion_defense/l_ion_defense_tool_weapon.json",
      unitCannon: "/pa/units/orbital/l_orbital_dropper/l_orbital_dropper.json",
      unitCannonBuildArm:
        "/pa/units/orbital/l_orbital_dropper/l_orbital_dropper_build_arm.json",
      unitCannonWeapon:
        "/pa/units/orbital/l_orbital_dropper/l_orbital_dropper_tool_weapon.json",
      vanguard: "/pa/units/land/l_tank_heavy_armor/l_tank_heavy_armor.json",
      vanguardAmmo:
        "/pa/units/land/l_tank_heavy_armor/l_tank_heavy_armor_ammo.json",
      vanguardWeapon:
        "/pa/units/land/l_tank_heavy_armor/l_tank_heavy_armor_tool_weapon.json",
      vehicleFabber:
        "/pa/units/land/l_fabrication_vehicle/l_fabrication_vehicle.json",
      vehicleFabberAdvanced:
        "/pa/units/land/l_fabrication_vehicle_adv/l_fabrication_vehicle_adv.json",
      vehicleFabberAdvancedBuildArm:
        "/pa/units/land/l_fabrication_vehicle_adv/l_fabrication_vehicle_adv_build_arm.json",
      vehicleFabberBuildArm:
        "/pa/units/land/l_fabrication_vehicle/l_fabrication_vehicle_build_arm.json",
      vehicleFactory: "/pa/units/land/l_vehicle_factory/l_vehicle_factory.json",
      vehicleFactoryAdvanced:
        "/pa/units/land/l_vehicle_factory_adv/l_vehicle_factory_adv.json",
      vehicleFactoryAdvancedBuildArm:
        "/pa/units/land/l_vehicle_factory_adv/l_vehicle_factory_adv_build_arm.json",
      vehicleFactoryBuildArm:
        "/pa/units/land/l_vehicle_factory/l_vehicle_factory_build_arm.json",
      wall: "/pa/units/land/l_land_barrier/l_land_barrier.json",
      wyrm: "/pa/units/air/l_air_carrier/l_air_carrier.json",
      wyrmAmmo: "/pa/units/air/l_air_carrier/l_air_carrier_ammo.json",
      wyrmWeapon: "/pa/units/air/l_air_carrier/l_air_carrier_tool_weapon.json",
      zeus: "/pa/units/air/l_titan_air/l_titan_air.json",
      zeusAmmo: "/pa/units/air/l_titan_air/l_titan_air_main_ammo.json",
      zeusWeapon: "/pa/units/air/l_titan_air/l_titan_air_main_tool_weapon.json",
    },
    unitNames: {
      "/pa/units/air/l_air_carrier/l_air_carrier.json": "!LOC:Meteor",
      "/pa/units/air/l_air_carrier/l_drone/l_drone.json": "!LOC:Meteoroid",
      "/pa/units/air/l_air_factory/l_air_factory.json": "!LOC:Flyer Foundry",
      "/pa/units/air/l_air_factory_adv/l_air_factory_adv.json":
        "!LOC:Advanced Flyer Foundry",
      "/pa/units/air/l_air_scout_adv/l_air_scout_adv.json": "!LOC:Infiltrator",
      "/pa/units/air/l_bomber/l_bomber.json": "!LOC:Dauntless",
      "/pa/units/air/l_fabrication_aircraft/l_fabrication_aircraft.json":
        "!LOC:Fabrication Flyer",
      "/pa/units/air/l_fabrication_aircraft_adv/l_fabrication_aircraft_adv.json":
        "!LOC:Advanced Fabrication Flyer",
      "/pa/units/air/l_fighter/l_fighter.json": "!LOC:Scythe",
      "/pa/units/air/l_fighter_adv/l_fighter_adv.json": "!LOC:Firebird",
      "/pa/units/air/l_firestarter/l_drop_turret/l_drop_turret.json":
        "!LOC:Purifier",
      "/pa/units/air/l_firestarter/l_firestarter.json": "!LOC:Salamander",
      "/pa/units/air/l_gunship/l_gunship.json": "!LOC:Lockheed",
      "/pa/units/air/l_raider/l_raider.json": "!LOC:Marauder",
      "/pa/units/air/l_titan_air/l_titan_air.json": "!LOC:Loki",
      "/pa/units/air/l_transport/l_transport.json": "!LOC:Osprey",
      "/pa/units/commanders/l_base/l_base.json": "Legion Class Commander",
      "/pa/units/land/l_air_defense/l_air_defense.json": "!LOC:Shredder",
      "/pa/units/land/l_air_defense_adv/l_air_defense_adv.json": "!LOC:Archer",
      "/pa/units/land/l_anti_nuke_launcher/l_anti_nuke_launcher.json":
        "!LOC:Iron Dome",
      "/pa/units/land/l_artillery_long/l_artillery_long.json": "!LOC:Gustav",
      "/pa/units/land/l_artillery_short/l_artillery_short.json": "!LOC:Theodor",
      "/pa/units/land/l_assault_bot/l_assault_bot.json": "!LOC:Peacekeeper",
      "/pa/units/land/l_bot_aa/l_bot_aa.json": "!LOC:Patriot",
      "/pa/units/land/l_bot_aa_adv/l_bot_aa_adv.json": "!LOC:Orbweaver",
      "/pa/units/land/l_bot_artillery/l_bot_artillery.json": "!LOC:Miniman",
      "/pa/units/land/l_bot_artillery_adv/l_bot_artillery_adv.json":
        "!LOC:Monstrosity",
      "/pa/units/land/l_bot_bomb/l_bot_bomb.json": "!LOC:Purger",
      "/pa/units/land/l_bot_factory/l_bot_factory.json": "!LOC:Walker Foundry",
      "/pa/units/land/l_bot_factory_adv/l_bot_factory_adv.json":
        "!LOC:Advanced Walker Foundry",
      "/pa/units/land/l_bot_support_commander/l_bot_support_commander.json":
        "!LOC:Praetorian",
      "/pa/units/land/l_control_module/l_control_module.json": "!LOC:Catalyst",
      "/pa/units/land/l_energy_plant/l_energy_plant.json":
        "!LOC:Power Catalyst",
      "/pa/units/land/l_energy_plant_adv/l_energy_plant_adv.json":
        "!LOC:Advanced Power Catalyst",
      "/pa/units/land/l_fabrication_bot/l_fabrication_bot.json":
        "!LOC:Fabrication Walker",
      "/pa/units/land/l_fabrication_bot_adv/l_fabrication_bot_adv.json":
        "!LOC:Advanced Fabrication Walker",
      "/pa/units/land/l_fabrication_vehicle/l_fabrication_vehicle.json":
        "!LOC:Armour Fabricator",
      "/pa/units/land/l_fabrication_vehicle_adv/l_fabrication_vehicle_adv.json":
        "!LOC:Advanced Armour Fabricator",
      "/pa/units/land/l_fabrication_vehicle_combat/l_fabrication_vehicle_combat.json":
        "!LOC:Guardian",
      "/pa/units/land/l_hover_tank/l_hover_tank.json": "!LOC:Corsair",
      "/pa/units/land/l_hover_tank_adv/l_hover_tank_adv.json": "!LOC:Panzer",
      "/pa/units/land/l_land_barrier/l_land_barrier.json": "!LOC:Clot",
      "/pa/units/land/l_land_mine/l_land_mine.json": "!LOC:Spoiler",
      "/pa/units/land/l_mex/l_mex.json": "!LOC:Mass Extractor",
      "/pa/units/land/l_mex_adv/l_mex_adv.json": "!LOC:Advanced Mass Extractor",
      "/pa/units/land/l_mortar_tank/l_mortar_tank.json": "!LOC:Stoke",
      "/pa/units/land/l_necromancer/l_necromancer.json": "!LOC:Necromancer",
      "/pa/units/land/l_nuke_launcher/l_nuke_launcher.json": "!LOC:Supernova",
      "/pa/units/land/l_nuke_launcher/l_nuke_launcher_ammo.json":
        "!LOC:Supernova Strategic Warhead",
      "/pa/units/land/l_radar/l_radar.json": "!LOC:Radar",
      "/pa/units/land/l_radar_adv/l_radar_adv.json": "!LOC:Overseer",
      "/pa/units/land/l_riot_bot/l_riot_bot.json": "!LOC:Enforcer",
      "/pa/units/land/l_rocket_barrage/l_rocket_barrage.json": "!LOC:Decimator",
      "/pa/units/land/l_shotgun_tank/l_shotgun_tank.json": "!LOC:Maul",
      "/pa/units/land/l_sniper_bot/l_sniper_bot.json": "!LOC:Lancer",
      "/pa/units/land/l_sniper_tank/l_sniper_tank.json": "!LOC:Deathmark",
      "/pa/units/land/l_storage/l_storage.json": "!LOC:OmniSilo Storage Device",
      "/pa/units/land/l_t1_turret_adv/l_t1_turret_adv.json": "!LOC:Scarab",
      "/pa/units/land/l_t1_turret_basic/l_t1_turret_basic.json": "!LOC:Jackal",
      "/pa/units/land/l_tank_heavy_armor/l_tank_heavy_armor.json":
        "!LOC:Earthshaker",
      "/pa/units/land/l_tank_laser_adv/l_tank_laser_adv.json": "!LOC:Scorpion",
      "/pa/units/land/l_tank_shank/l_tank_shank.json": "!LOC:Shank",
      "/pa/units/land/l_tank_swarm/l_tank_swarm.json": "!LOC:Havoc",
      "/pa/units/land/l_teleporter/l_teleporter.json": "!LOC:Sky Bridge",
      "/pa/units/land/l_titan_bot/l_titan_bot.json": "!LOC:Thor",
      "/pa/units/land/l_titan_structure/l_titan_structure.json":
        "!LOC:Holocene",
      "/pa/units/land/l_titan_vehicle/l_titan_vehicle.json": "!LOC:Odin",
      "/pa/units/land/l_vehicle_factory/l_vehicle_factory.json":
        "!LOC:Armour Foundry",
      "/pa/units/land/l_vehicle_factory_adv/l_vehicle_factory_adv.json":
        "!LOC:Advanced Armour Foundry",
      "/pa/units/orbital/l_defense_satellite/l_defense_satellite.json":
        "!LOC:Centurion",
      "/pa/units/orbital/l_delta_v_engine/l_delta_v_engine.json":
        "!LOC:Diplomat",
      "/pa/units/orbital/l_ion_defense/l_ion_defense.json": "!LOC:Tola",
      "/pa/units/orbital/l_mining_platform/l_mining_platform.json": "!LOC:Rig",
      "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship.json":
        "!LOC:Imperator",
      "/pa/units/orbital/l_orbital_dropper/l_orbital_dropper.json":
        "!LOC:Starcannon",
      "/pa/units/orbital/l_orbital_fabrication_bot/l_orbital_fabrication_bot.json":
        "!LOC:Fabrication Starship",
      "/pa/units/orbital/l_orbital_factory/l_orbital_factory.json":
        "!LOC:Starship Foundry",
      "/pa/units/orbital/l_orbital_fighter/l_orbital_fighter.json":
        "!LOC:Viper",
      "/pa/units/orbital/l_orbital_lander/l_orbital_lander.json":
        "!LOC:Chariot",
      "/pa/units/orbital/l_orbital_laser/l_orbital_laser.json":
        "!LOC:Black Knight",
      "/pa/units/orbital/l_orbital_launcher/l_orbital_launcher.json":
        "!LOC:Starship Projector",
      "/pa/units/orbital/l_orbital_probe/l_orbital_probe.json": "!LOC:Spectre",
      "/pa/units/orbital/l_orbital_railgun/l_orbital_railgun.json":
        "!LOC:Paladin",
      "/pa/units/orbital/l_radar_satellite/l_radar_satellite.json":
        "!LOC:Sputnik",
      "/pa/units/orbital/l_radar_satellite_adv/l_radar_satellite_adv.json":
        "!LOC:Kosmos",
      "/pa/units/orbital/l_titan_orbital/l_titan_orbital.json": "!LOC:Tyr",
      "/pa/units/sea/l_attack_sub/l_attack_sub.json": "!LOC:Akula",
      "/pa/units/sea/l_battleship/l_battleship.json": "!LOC:Epoch",
      "/pa/units/sea/l_destroyer/l_destroyer.json": "!LOC:Bowhead",
      "/pa/units/sea/l_fabrication_ship/l_fabrication_ship.json":
        "!LOC:Fabrication Vessel",
      "/pa/units/sea/l_fabrication_ship_adv/l_fabrication_ship_adv.json":
        "!LOC:Advanced Fabrication Vessel",
      "/pa/units/sea/l_fabrication_sub_combat_adv/l_fabrication_sub_combat_adv.json":
        "!LOC:Remora",
      "/pa/units/sea/l_frigate/l_frigate.json": "!LOC:Talos",
      "/pa/units/sea/l_hover_ship/l_hover_ship.json": "!LOC:Jaeger",
      "/pa/units/sea/l_missile_ship/l_missile_ship.json": "!LOC:Manta",
      "/pa/units/sea/l_naval_factory/l_naval_factory.json": "!LOC:Ship Foundry",
      "/pa/units/sea/l_naval_factory_adv/l_naval_factory_adv.json":
        "!LOC:Advanced Ship Foundry",
      "/pa/units/sea/l_sea_scout/l_sea_scout.json": "!LOC:Catfish",
      "/pa/units/sea/l_sea_tank/l_sea_tank.json": "!LOC:Hammerhead",
      "/pa/units/sea/l_torpedo_launcher/l_torpedo_launcher.json": "!LOC:Ripple",
      "/pa/units/sea/l_torpedo_launcher_adv/l_torpedo_launcher_adv.json":
        "!LOC:Tsunami",
    },
  };
});
