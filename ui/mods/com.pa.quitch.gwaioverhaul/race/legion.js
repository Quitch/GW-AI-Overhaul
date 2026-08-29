// Legion Expansion as a Galactic War race. Commanders and AI data are what the
// mod ships. `units` names every Legion spec by a Legion key (the same shape as
// shared/units.js, so Legion-only cards can address them), `mla` says which
// units.js key(s) each Legion key stands in for, and `unitNames` carries the
// display names by Legion key. See races.md.
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
      akula: "/pa/units/sea/l_attack_sub/l_attack_sub.json",
      akulaAmmo: "/pa/units/sea/l_attack_sub/l_attack_sub_ammo.json",
      akulaWeapon: "/pa/units/sea/l_attack_sub/l_attack_sub_tool_weapon.json",
      aoeNova: "/pa/units/air/l_air_bomb/triggered/l_air_bomb.json",
      aoeNovaAmmo: "/pa/units/air/l_air_bomb/triggered/l_air_bomb_ammo.json",
      aoeNovaDeathAmmo:
        "/pa/units/air/l_air_bomb/triggered/l_air_bomb_death_ammo.json",
      aoeNovaDeathWeapon:
        "/pa/units/air/l_air_bomb/triggered/l_air_bomb_death_tool_weapon.json",
      aoeNovaWeapon:
        "/pa/units/air/l_air_bomb/triggered/l_air_bomb_tool_weapon.json",
      archer: "/pa/units/land/l_air_defense_adv/l_air_defense_adv.json",
      archerAmmo:
        "/pa/units/land/l_air_defense_adv/l_air_defense_adv_ammo.json",
      archerWeapon:
        "/pa/units/land/l_air_defense_adv/l_air_defense_adv_tool_weapon.json",
      armourFabricator:
        "/pa/units/land/l_fabrication_vehicle/l_fabrication_vehicle.json",
      armourFabricatorAdvanced:
        "/pa/units/land/l_fabrication_vehicle_adv/l_fabrication_vehicle_adv.json",
      armourFabricatorAdvancedBuildArm:
        "/pa/units/land/l_fabrication_vehicle_adv/l_fabrication_vehicle_adv_build_arm.json",
      armourFabricatorBuildArm:
        "/pa/units/land/l_fabrication_vehicle/l_fabrication_vehicle_build_arm.json",
      armourFoundry: "/pa/units/land/l_vehicle_factory/l_vehicle_factory.json",
      armourFoundryAdvanced:
        "/pa/units/land/l_vehicle_factory_adv/l_vehicle_factory_adv.json",
      armourFoundryAdvancedBuildArm:
        "/pa/units/land/l_vehicle_factory_adv/l_vehicle_factory_adv_build_arm.json",
      armourFoundryBuildArm:
        "/pa/units/land/l_vehicle_factory/l_vehicle_factory_build_arm.json",
      arsonist: "/pa/units/land/l_flame_turret/l_flame_turret.json",
      arsonistAmmo: "/pa/units/land/l_flame_turret/l_flame_turret_ammo.json",
      arsonistWeapon:
        "/pa/units/land/l_flame_turret/l_flame_turret_tool_weapon.json",
      blackKnight: "/pa/units/orbital/l_orbital_laser/l_orbital_laser.json",
      blackKnightAmmo:
        "/pa/units/orbital/l_orbital_laser/l_orbital_laser_ammo.json",
      blackKnightShieldKillerAmmo:
        "/pa/units/orbital/l_orbital_laser/l_orbital_laser_shield_killer_ammo.json",
      blackKnightShieldKillerWeapon:
        "/pa/units/orbital/l_orbital_laser/l_orbital_laser_shield_killer_tool_weapon.json",
      blackKnightWeapon:
        "/pa/units/orbital/l_orbital_laser/l_orbital_laser_tool_weapon.json",
      boombotCocoon:
        "/pa/units/land/l_necromancer/l_minion/l_minion_spawner.json",
      boombotCocoonAmmo:
        "/pa/units/land/l_necromancer/l_minion/l_minion_spawner_ammo.json",
      boombotCocoonDeathWeapon:
        "/pa/units/land/l_necromancer/l_minion/l_minion_spawner_death_weapon.json",
      bowhead: "/pa/units/sea/l_destroyer/l_destroyer.json",
      bowheadAmmo: "/pa/units/sea/l_destroyer/l_destroyer_ammo.json",
      bowheadWeapon: "/pa/units/sea/l_destroyer/l_destroyer_tool_weapon.json",
      cameraTarget: "/pa/units/air/l_air_scout_adv/l_vision/l_vision.json",
      cameraTargetDeathAmmo:
        "/pa/units/air/l_air_scout_adv/l_vision/l_vision_death_ammo.json",
      cameraTargetDeathWeapon:
        "/pa/units/air/l_air_scout_adv/l_vision/l_vision_death_tool_weapon.json",
      catalyst: "/pa/units/land/l_control_module/l_control_module.json",
      catfish: "/pa/units/sea/l_sea_scout/l_sea_scout.json",
      catfishAmmo: "/pa/units/sea/l_sea_scout/l_sea_scout_ammo.json",
      catfishTorpedoAmmo:
        "/pa/units/sea/l_sea_scout/l_sea_scout_torpedo_ammo.json",
      catfishTorpedoWeapon:
        "/pa/units/sea/l_sea_scout/l_sea_scout_torpedo_tool_weapon.json",
      catfishWeapon: "/pa/units/sea/l_sea_scout/l_sea_scout_tool_weapon.json",
      centurion:
        "/pa/units/orbital/l_defense_satellite/l_defense_satellite.json",
      centurionAmmo:
        "/pa/units/orbital/l_defense_satellite/l_defense_satellite_ammo.json",
      centurionGroundAmmo:
        "/pa/units/orbital/l_defense_satellite/l_defense_satellite_ground_ammo.json",
      centurionGroundWeapon:
        "/pa/units/orbital/l_defense_satellite/l_defense_satellite_ground_tool_weapon.json",
      centurionWeapon:
        "/pa/units/orbital/l_defense_satellite/l_defense_satellite_tool_weapon.json",
      chariot: "/pa/units/orbital/l_orbital_lander/l_orbital_lander.json",
      clot: "/pa/units/land/l_land_barrier/l_land_barrier.json",
      comet: "/pa/units/air/l_flying_teleporter/l_flying_teleporter.json",
      commander: "/pa/units/commanders/l_base/l_base.json",
      corsair: "/pa/units/land/l_hover_tank/l_hover_tank.json",
      corsairAmmo: "/pa/units/land/l_hover_tank/l_hover_tank_ammo.json",
      corsairWeapon:
        "/pa/units/land/l_hover_tank/l_hover_tank_tool_weapon.json",
      dauntless: "/pa/units/air/l_bomber/l_bomber.json",
      dauntlessAmmo: "/pa/units/air/l_bomber/l_bomber_ammo.json",
      dauntlessWeapon: "/pa/units/air/l_bomber/l_bomber_tool_weapon.json",
      deathmark: "/pa/units/land/l_sniper_tank/l_sniper_tank.json",
      deathmarkAmmo: "/pa/units/land/l_sniper_tank/l_sniper_tank_ammo.json",
      deathmarkWeapon:
        "/pa/units/land/l_sniper_tank/l_sniper_tank_tool_weapon.json",
      decimator: "/pa/units/land/l_rocket_barrage/l_rocket_barrage.json",
      decimatorAmmo:
        "/pa/units/land/l_rocket_barrage/l_rocket_barrage_ammo.json",
      decimatorWeapon:
        "/pa/units/land/l_rocket_barrage/l_rocket_barrage_tool_weapon.json",
      diplomat: "/pa/units/orbital/l_delta_v_engine/l_delta_v_engine.json",
      earthshaker: "/pa/units/land/l_tank_heavy_armor/l_tank_heavy_armor.json",
      earthshakerAmmo:
        "/pa/units/land/l_tank_heavy_armor/l_tank_heavy_armor_ammo.json",
      earthshakerWeapon:
        "/pa/units/land/l_tank_heavy_armor/l_tank_heavy_armor_tool_weapon.json",
      enforcer: "/pa/units/land/l_riot_bot/l_riot_bot.json",
      enforcerAmmo: "/pa/units/land/l_riot_bot/l_riot_bot_ammo.json",
      enforcerWeapon: "/pa/units/land/l_riot_bot/l_riot_bot_tool_weapon.json",
      epoch: "/pa/units/sea/l_battleship/l_battleship.json",
      epochLowerAmmo: "/pa/units/sea/l_battleship/l_battleship_lower_ammo.json",
      epochLowerWeapon:
        "/pa/units/sea/l_battleship/l_battleship_lower_tool_weapon.json",
      epochUpperAmmo: "/pa/units/sea/l_battleship/l_battleship_upper_ammo.json",
      epochUpperWeapon:
        "/pa/units/sea/l_battleship/l_battleship_upper_tool_weapon.json",
      fabricationFlyer:
        "/pa/units/air/l_fabrication_aircraft/l_fabrication_aircraft.json",
      fabricationFlyerAdvanced:
        "/pa/units/air/l_fabrication_aircraft_adv/l_fabrication_aircraft_adv.json",
      fabricationFlyerAdvancedBuildArm:
        "/pa/units/air/l_fabrication_aircraft_adv/l_fabrication_aircraft_adv_build_arm.json",
      fabricationFlyerBuildArm:
        "/pa/units/air/l_fabrication_aircraft/l_fabrication_aircraft_build_arm.json",
      fabricationStarship:
        "/pa/units/orbital/l_orbital_fabrication_bot/l_orbital_fabrication_bot.json",
      fabricationStarshipBuildArm:
        "/pa/units/orbital/l_orbital_fabrication_bot/l_orbital_fabrication_bot_build_arm.json",
      fabricationVessel:
        "/pa/units/sea/l_fabrication_ship/l_fabrication_ship.json",
      fabricationVesselAdvanced:
        "/pa/units/sea/l_fabrication_ship_adv/l_fabrication_ship_adv.json",
      fabricationVesselAdvancedBuildArm:
        "/pa/units/sea/l_fabrication_ship_adv/l_fabrication_ship_adv_build_arm.json",
      fabricationVesselBuildArm:
        "/pa/units/sea/l_fabrication_ship/l_fabrication_ship_build_arm.json",
      fabricationWalker:
        "/pa/units/land/l_fabrication_bot/l_fabrication_bot.json",
      fabricationWalkerAdvanced:
        "/pa/units/land/l_fabrication_bot_adv/l_fabrication_bot_adv.json",
      fabricationWalkerAdvancedBuildArm:
        "/pa/units/land/l_fabrication_bot_adv/l_fabrication_bot_adv_build_arm.json",
      fabricationWalkerBuildArm:
        "/pa/units/land/l_fabrication_bot/l_fabrication_bot_build_arm.json",
      firebird: "/pa/units/air/l_fighter_adv/l_fighter_adv.json",
      firebirdAmmo: "/pa/units/air/l_fighter_adv/l_fighter_adv_ammo.json",
      firebirdRocketAmmo:
        "/pa/units/air/l_fighter_adv/l_fighter_adv_rocket_ammo.json",
      firebirdRocketWeapon:
        "/pa/units/air/l_fighter_adv/l_fighter_adv_rocket_tool_weapon.json",
      firebirdWeapon:
        "/pa/units/air/l_fighter_adv/l_fighter_adv_tool_weapon.json",
      flyerFoundry: "/pa/units/air/l_air_factory/l_air_factory.json",
      flyerFoundryAdvanced:
        "/pa/units/air/l_air_factory_adv/l_air_factory_adv.json",
      flyerFoundryAdvancedBuildArm:
        "/pa/units/air/l_air_factory_adv/l_air_factory_adv_build_arm.json",
      flyerFoundryBuildArm:
        "/pa/units/air/l_air_factory/l_air_factory_build_arm.json",
      guardian:
        "/pa/units/land/l_fabrication_vehicle_combat/l_fabrication_vehicle_combat.json",
      guardianBuildArm:
        "/pa/units/land/l_fabrication_vehicle_combat/l_fabrication_vehicle_combat_build_arm.json",
      gustav: "/pa/units/land/l_artillery_long/l_artillery_long.json",
      gustavAmmo: "/pa/units/land/l_artillery_long/l_artillery_long_ammo.json",
      gustavWeapon:
        "/pa/units/land/l_artillery_long/l_artillery_long_tool_weapon.json",
      hammerhead: "/pa/units/sea/l_sea_tank/l_sea_tank.json",
      hammerheadAmmo: "/pa/units/sea/l_sea_tank/l_sea_tank_ammo.json",
      hammerheadRamAmmo: "/pa/units/sea/l_sea_tank/l_sea_tank_ram_ammo.json",
      hammerheadRamWeapon:
        "/pa/units/sea/l_sea_tank/l_sea_tank_ram_tool_weapon.json",
      hammerheadTorpedoAmmo:
        "/pa/units/sea/l_sea_tank/l_sea_tank_torpedo_ammo.json",
      hammerheadTorpedoWeapon:
        "/pa/units/sea/l_sea_tank/l_sea_tank_torpedo_tool_weapon.json",
      hammerheadWeapon: "/pa/units/sea/l_sea_tank/l_sea_tank_tool_weapon.json",
      havoc: "/pa/units/land/l_tank_swarm/l_tank_swarm.json",
      havocAmmo: "/pa/units/land/l_tank_swarm/l_tank_swarm_ammo.json",
      havocBeamAmmo: "/pa/units/land/bot_sniper/bot_sniper_beam_ammo.json",
      havocBeamWeapon:
        "/pa/units/land/bot_sniper/bot_sniper_beam_tool_weapon.json",
      havocWeapon: "/pa/units/land/l_tank_swarm/l_tank_swarm_tool_weapon.json",
      hive: "/pa/units/land/l_swarm_hive/l_swarm_hive.json",
      hiveAmmo: "/pa/units/land/l_swarm_hive/l_swarm_hive_ammo.json",
      hiveWeapon: "/pa/units/land/l_swarm_hive/l_swarm_hive_tool_weapon.json",
      holocene: "/pa/units/land/l_titan_structure/l_titan_structure.json",
      holocenePbaoe:
        "/pa/units/land/titan_structure/titan_structure_pbaoe.json",
      holoceneWeapon:
        "/pa/units/land/titan_structure/titan_structure_tool_weapon.json",
      imperator:
        "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship.json",
      imperatorAmmo:
        "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship_ammo.json",
      imperatorAmmoDrone:
        "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship_ammo_drone.json",
      imperatorAmmoGround:
        "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship_ammo_ground.json",
      imperatorMainAmmo:
        "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship_main_ammo.json",
      imperatorMainWeapon:
        "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship_main_tool_weapon.json",
      imperatorMeteoroid:
        "/pa/units/orbital/l_orbital_battleship/l_drone/l_drone.json",
      imperatorMeteoroidWeapon:
        "/pa/units/orbital/l_orbital_battleship/l_drone/l_drone_tool_weapon.json",
      imperatorWeapon:
        "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship_tool_weapon.json",
      imperatorWeaponDrone:
        "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship_tool_weapon_drone.json",
      imperatorWeaponGround:
        "/pa/units/orbital/l_orbital_battleship/l_orbital_battleship_tool_weapon_ground.json",
      infiltrator: "/pa/units/air/l_air_scout_adv/l_air_scout_adv.json",
      infiltratorAmmo:
        "/pa/units/air/l_air_scout_adv/l_air_scout_adv_ammo.json",
      infiltratorVisionAmmo:
        "/pa/units/air/l_air_scout_adv/l_air_scout_adv_vision_ammo.json",
      infiltratorVisionWeapon:
        "/pa/units/air/l_air_scout_adv/l_air_scout_adv_vision_tool_weapon.json",
      investigator: "/pa/units/land/l_scout_bot/l_scout_bot.json",
      investigatorDummyAmmo:
        "/pa/units/land/land_scout/land_scout_dummy_ammo.json",
      investigatorLandAmmo:
        "/pa/units/land/l_scout_bot/l_scout_bot_land_ammo.json",
      investigatorRadar:
        "/pa/units/land/l_scout_bot/l_scout_bot_radar_mode.json",
      investigatorRadarCollisionCheck:
        "/pa/units/land/l_scout_bot/l_scout_bot_radar_mode_collision_check.json",
      investigatorRadarCollisionCheckLandAmmo:
        "/pa/units/land/l_scout_bot/l_scout_bot_radar_mode_collision_check_land_ammo.json",
      investigatorRadarCollisionCheckWeapon:
        "/pa/units/land/l_scout_bot/l_scout_bot_radar_mode_collision_check_tool_weapon.json",
      investigatorRadarLandAmmo:
        "/pa/units/land/l_scout_bot/l_scout_bot_radar_mode_land_ammo.json",
      investigatorRadarWeapon:
        "/pa/units/land/l_scout_bot/l_scout_bot_radar_mode_tool_weapon.json",
      investigatorToolDummyWeapon:
        "/pa/units/land/land_scout/land_scout_tool_dummy_weapon.json",
      investigatorWeapon:
        "/pa/units/land/l_scout_bot/l_scout_bot_tool_weapon.json",
      ironDome: "/pa/units/land/l_anti_nuke_launcher/l_anti_nuke_launcher.json",
      ironDomeAmmo:
        "/pa/units/land/l_anti_nuke_launcher/l_anti_nuke_launcher_ammo.json",
      ironDomeAmmo2:
        "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher_ammo.json",
      ironDomeBuildArm:
        "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher_build_arm.json",
      ironDomeWeapon:
        "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher_tool_weapon.json",
      jackal: "/pa/units/land/l_t1_turret_basic/l_t1_turret_basic.json",
      jackalAmmo:
        "/pa/units/land/l_t1_turret_basic/l_t1_turret_basic_ammo.json",
      jackalWeapon:
        "/pa/units/land/l_t1_turret_basic/l_t1_turret_basic_tool_weapon.json",
      jaeger: "/pa/units/sea/l_hover_ship/l_hover_ship.json",
      jaegerAmmo: "/pa/units/sea/l_hover_ship/l_hover_ship_ammo.json",
      jaegerAmmoSide: "/pa/units/sea/l_hover_ship/l_hover_ship_ammo_side.json",
      jaegerWeapon: "/pa/units/sea/l_hover_ship/l_hover_ship_tool_weapon.json",
      jaegerWeaponSide:
        "/pa/units/sea/l_hover_ship/l_hover_ship_tool_weapon_side.json",
      kosmos:
        "/pa/units/orbital/l_radar_satellite_adv/l_radar_satellite_adv.json",
      kosmosAmmo:
        "/pa/units/orbital/l_radar_satellite_adv/l_radar_satellite_adv_ammo.json",
      kosmosWeapon:
        "/pa/units/orbital/l_radar_satellite_adv/l_radar_satellite_adv_tool_weapon.json",
      lancer: "/pa/units/land/l_sniper_bot/l_sniper_bot.json",
      lancerAmmo: "/pa/units/land/l_sniper_bot/l_sniper_bot_ammo.json",
      lancerWeapon: "/pa/units/land/l_sniper_bot/l_sniper_bot_tool_weapon.json",
      lockheed: "/pa/units/air/l_gunship/l_gunship.json",
      lockheedMainAmmo: "/pa/units/air/l_gunship/l_gunship_main_ammo.json",
      lockheedMainWeapon:
        "/pa/units/air/l_gunship/l_gunship_main_tool_weapon.json",
      lockheedRocketAmmo: "/pa/units/air/l_gunship/l_gunship_rocket_ammo.json",
      lockheedRocketWeapon:
        "/pa/units/air/l_gunship/l_gunship_rocket_tool_weapon.json",
      loki: "/pa/units/air/l_titan_air/l_titan_air.json",
      lokiMainAmmo: "/pa/units/air/l_titan_air/l_titan_air_main_ammo.json",
      lokiMainWeapon:
        "/pa/units/air/l_titan_air/l_titan_air_main_tool_weapon.json",
      lokiSideAmmo: "/pa/units/air/l_titan_air/l_titan_air_side_ammo.json",
      lokiSideWeapon:
        "/pa/units/air/l_titan_air/l_titan_air_side_tool_weapon.json",
      manta: "/pa/units/sea/l_missile_ship/l_missile_ship.json",
      mantaAntidropAmmo:
        "/pa/units/sea/l_missile_ship/l_missile_ship_antidrop_ammo.json",
      mantaAntiucWeapon:
        "/pa/units/sea/l_missile_ship/l_missile_ship_antiuc_tool_weapon.json",
      mantaBeamAmmo:
        "/pa/units/sea/l_missile_ship/l_missile_ship_beam_ammo.json",
      mantaBeamWeapon:
        "/pa/units/sea/l_missile_ship/l_missile_ship_beam_tool_weapon.json",
      mantaLightAmmo:
        "/pa/units/sea/l_missile_ship/l_missile_ship_light_ammo.json",
      mantaLightWeapon:
        "/pa/units/sea/l_missile_ship/l_missile_ship_light_tool_weapon.json",
      mantaRocketAmmo:
        "/pa/units/sea/l_missile_ship/l_missile_ship_rocket_ammo.json",
      mantaRocketWeapon:
        "/pa/units/sea/l_missile_ship/l_missile_ship_rocket_tool_weapon.json",
      marauder: "/pa/units/air/l_raider/l_raider.json",
      marauderAmmo: "/pa/units/air/l_raider/l_raider_ammo.json",
      marauderWeapon: "/pa/units/air/l_raider/l_raider_tool_weapon.json",
      massExtractor: "/pa/units/land/l_mex/l_mex.json",
      massExtractorAdvanced: "/pa/units/land/l_mex_adv/l_mex_adv.json",
      maul: "/pa/units/land/l_shotgun_tank/l_shotgun_tank.json",
      maulAmmo: "/pa/units/land/l_shotgun_tank/l_shotgun_tank_ammo.json",
      maulWeapon:
        "/pa/units/land/l_shotgun_tank/l_shotgun_tank_tool_weapon.json",
      meteor: "/pa/units/air/l_air_carrier/l_air_carrier.json",
      meteorAmmo: "/pa/units/air/l_air_carrier/l_air_carrier_ammo.json",
      meteorWeapon:
        "/pa/units/air/l_air_carrier/l_air_carrier_tool_weapon.json",
      meteoroid: "/pa/units/air/l_air_carrier/l_drone/l_drone.json",
      meteoroidAmmo: "/pa/units/air/l_air_carrier/l_drone/l_drone_ammo.json",
      meteoroidDeathAmmo:
        "/pa/units/air/l_air_carrier/l_drone/l_drone_death_ammo.json",
      meteoroidDeathWeapon:
        "/pa/units/air/l_air_carrier/l_drone/l_drone_death_tool_weapon.json",
      meteoroidWeapon:
        "/pa/units/air/l_air_carrier/l_drone/l_drone_tool_weapon.json",
      miniman: "/pa/units/land/l_bot_artillery/l_bot_artillery.json",
      minimanAmmo: "/pa/units/land/l_bot_artillery/l_bot_artillery_ammo.json",
      minimanWeapon:
        "/pa/units/land/l_bot_artillery/l_bot_artillery_tool_weapon.json",
      monstrosity:
        "/pa/units/land/l_bot_artillery_adv/l_bot_artillery_adv.json",
      monstrosityAmmo:
        "/pa/units/land/l_bot_artillery_adv/l_bot_artillery_adv_ammo.json",
      monstrosityLightAmmo:
        "/pa/units/land/l_bot_artillery_adv/l_bot_artillery_adv_light_ammo.json",
      monstrosityLightWeapon:
        "/pa/units/land/l_bot_artillery_adv/l_bot_artillery_adv_light_tool_weapon.json",
      monstrosityWeapon:
        "/pa/units/land/l_bot_artillery_adv/l_bot_artillery_adv_tool_weapon.json",
      nanoswarm:
        "/pa/units/land/l_swarm_hive/l_hive_nanoswarm/l_hive_nanoswarm.json",
      nanoswarmAmmo:
        "/pa/units/land/l_swarm_hive/l_hive_nanoswarm/l_hive_nanoswarm_ammo.json",
      nanoswarmDeathAmmo:
        "/pa/units/land/l_swarm_hive/l_hive_nanoswarm/l_hive_nanoswarm_death_ammo.json",
      nanoswarmDeathWeapon:
        "/pa/units/land/l_swarm_hive/l_hive_nanoswarm/l_hive_nanoswarm_death_tool_weapon.json",
      nanoswarmWeapon:
        "/pa/units/land/l_swarm_hive/l_hive_nanoswarm/l_hive_nanoswarm_tool_weapon.json",
      necromancer: "/pa/units/land/l_necromancer/l_necromancer.json",
      necromancerAmmo: "/pa/units/land/l_necromancer/l_necromancer_ammo.json",
      necromancerPurger: "/pa/units/land/l_necromancer/l_minion/l_minion.json",
      necromancerPurgerAmmo:
        "/pa/units/land/l_necromancer/l_minion/l_minion_ammo.json",
      necromancerPurgerJumpAmmo:
        "/pa/units/land/l_necromancer/l_minion/l_minion_jump_ammo.json",
      necromancerPurgerJumpWeapon:
        "/pa/units/land/l_necromancer/l_minion/l_minion_jump_tool_weapon.json",
      necromancerPurgerWeapon:
        "/pa/units/land/l_necromancer/l_minion/l_minion_tool_weapon.json",
      necromancerWeapon:
        "/pa/units/land/l_necromancer/l_necromancer_tool_weapon.json",
      nova: "/pa/units/air/l_air_bomb/l_air_bomb.json",
      novaAmmo: "/pa/units/air/l_air_bomb/l_air_bomb_ammo.json",
      novaDeployWeapon:
        "/pa/units/air/l_air_bomb/l_air_bomb_deploy_tool_weapon.json",
      novaTracerAmmo: "/pa/units/air/l_air_bomb/l_air_bomb_tracer_ammo.json",
      novaTracerWeapon:
        "/pa/units/air/l_air_bomb/l_air_bomb_tracer_tool_weapon.json",
      novaWeapon: "/pa/units/air/l_air_bomb/l_air_bomb_tool_weapon.json",
      odin: "/pa/units/land/l_titan_vehicle/l_titan_vehicle.json",
      odinAmmoMain:
        "/pa/units/land/l_titan_vehicle/l_titan_vehicle_ammo_main.json",
      odinAmmoSide:
        "/pa/units/land/l_titan_vehicle/l_titan_vehicle_ammo_side.json",
      odinWeaponMain:
        "/pa/units/land/l_titan_vehicle/l_titan_vehicle_tool_weapon_main.json",
      odinWeaponSide:
        "/pa/units/land/l_titan_vehicle/l_titan_vehicle_tool_weapon_side.json",
      omniSilo: "/pa/units/land/l_storage/l_storage.json",
      orbweaver: "/pa/units/land/l_bot_aa_adv/l_bot_aa_adv.json",
      orbweaverAmmo: "/pa/units/land/l_bot_aa_adv/l_bot_aa_adv_ammo.json",
      orbweaverWeapon:
        "/pa/units/land/l_bot_aa_adv/l_bot_aa_adv_tool_weapon.json",
      osprey: "/pa/units/air/l_transport/l_transport.json",
      overseer: "/pa/units/land/l_radar_adv/l_radar_adv.json",
      paladin: "/pa/units/orbital/l_orbital_railgun/l_orbital_railgun.json",
      paladinAmmo:
        "/pa/units/orbital/l_orbital_railgun/l_orbital_railgun_ammo.json",
      paladinWeapon:
        "/pa/units/orbital/l_orbital_railgun/l_orbital_railgun_tool_weapon.json",
      panzer: "/pa/units/land/l_hover_tank_adv/l_hover_tank_adv.json",
      panzerAmmo: "/pa/units/land/l_hover_tank_adv/l_hover_tank_adv_ammo.json",
      panzerAntiDropAmmo:
        "/pa/units/land/l_hover_tank_adv/l_hover_tank_adv_anti_drop_ammo.json",
      panzerAntiDropWeapon:
        "/pa/units/land/l_hover_tank_adv/l_hover_tank_adv_anti_drop_tool_weapon.json",
      panzerWeapon:
        "/pa/units/land/l_hover_tank_adv/l_hover_tank_adv_tool_weapon.json",
      patriot: "/pa/units/land/l_bot_aa/l_bot_aa.json",
      patriotAmmo: "/pa/units/land/l_bot_aa/l_bot_aa_ammo.json",
      patriotWeapon: "/pa/units/land/l_bot_aa/l_bot_aa_tool_weapon.json",
      peacekeeper: "/pa/units/land/l_assault_bot/l_assault_bot.json",
      peacekeeperAmmo: "/pa/units/land/l_assault_bot/l_assault_bot_ammo.json",
      peacekeeperWeapon:
        "/pa/units/land/l_assault_bot/l_assault_bot_tool_weapon.json",
      powerCatalyst: "/pa/units/land/l_energy_plant/l_energy_plant.json",
      powerCatalystAdvanced:
        "/pa/units/land/l_energy_plant_adv/l_energy_plant_adv.json",
      powerCatalystAdvancedAmmo:
        "/pa/units/land/assault_bot/assault_bot_ammo.json",
      powerCatalystAdvancedDeathRange:
        "/pa/units/land/l_energy_plant_adv/death_range.json",
      praetorian:
        "/pa/units/land/l_bot_support_commander/l_bot_support_commander.json",
      praetorianAmmo:
        "/pa/units/land/l_bot_support_commander/l_bot_support_commander_ammo.json",
      praetorianToolBuildArm:
        "/pa/units/land/l_bot_support_commander/l_bot_support_commander_tool_build_arm.json",
      praetorianWeapon:
        "/pa/units/land/l_bot_support_commander/l_bot_support_commander_tool_weapon.json",
      purger: "/pa/units/land/l_bot_bomb/l_bot_bomb.json",
      purgerAmmo: "/pa/units/land/l_bot_bomb/l_bot_bomb_ammo.json",
      purgerJumpAmmo: "/pa/units/land/l_bot_bomb/l_bot_bomb_jump_ammo.json",
      purgerJumpWeapon:
        "/pa/units/land/l_bot_bomb/l_bot_bomb_jump_tool_weapon.json",
      purgerWeapon: "/pa/units/land/l_bot_bomb/l_bot_bomb_tool_weapon.json",
      purifier: "/pa/units/air/l_firestarter/l_drop_turret/l_drop_turret.json",
      purifierAmmo:
        "/pa/units/air/l_firestarter/l_drop_turret/l_drop_turret_ammo.json",
      purifierCollisionCheck:
        "/pa/units/air/l_firestarter/l_drop_turret/l_drop_turret_collision_check.json",
      purifierCollisionCheckAmmo:
        "/pa/units/air/l_firestarter/l_drop_turret/l_drop_turret_collision_check_ammo.json",
      purifierCollisionCheckWeapon:
        "/pa/units/air/l_firestarter/l_drop_turret/l_drop_turret_collision_check_tool_weapon.json",
      purifierWeapon:
        "/pa/units/air/l_firestarter/l_drop_turret/l_drop_turret_tool_weapon.json",
      radar: "/pa/units/land/l_radar/l_radar.json",
      rampart: "/pa/units/land/l_shield_gen/l_shield_gen.json",
      rampartAmmo: "/pa/units/land/l_shield_gen/l_shield_gen_ammo.json",
      rampartLongWeapon:
        "/pa/units/land/l_shield_gen/l_shield_gen_long_tool_weapon.json",
      remora:
        "/pa/units/sea/l_fabrication_sub_combat_adv/l_fabrication_sub_combat_adv.json",
      remoraBuildArm:
        "/pa/units/sea/l_fabrication_sub_combat_adv/l_fabrication_sub_combat_adv_build_arm.json",
      rig: "/pa/units/orbital/l_mining_platform/l_mining_platform.json",
      ripple: "/pa/units/sea/l_torpedo_launcher/l_torpedo_launcher.json",
      rippleWaveAmmo:
        "/pa/units/sea/l_torpedo_launcher/l_torpedo_launcher_wave_ammo.json",
      rippleWaveWeapon:
        "/pa/units/sea/l_torpedo_launcher/l_torpedo_launcher_wave_tool_weapon.json",
      salamander: "/pa/units/air/l_firestarter/l_firestarter.json",
      salamanderFlameDropAmmo:
        "/pa/units/air/l_firestarter/l_firestarter_flame_drop_ammo.json",
      salamanderFlameDropWeapon:
        "/pa/units/air/l_firestarter/l_firestarter_flame_drop_tool_weapon.json",
      salamanderTurretAmmo:
        "/pa/units/air/l_firestarter/l_firestarter_turret_ammo.json",
      salamanderTurretWeapon:
        "/pa/units/air/l_firestarter/l_firestarter_turret_tool_weapon.json",
      scarab: "/pa/units/land/l_t1_turret_adv/l_t1_turret_adv.json",
      scarabAmmo: "/pa/units/land/l_t1_turret_adv/l_t1_turret_adv_ammo.json",
      scarabWeapon:
        "/pa/units/land/l_t1_turret_adv/l_t1_turret_adv_tool_weapon.json",
      scorpion: "/pa/units/land/l_tank_laser_adv/l_tank_laser_adv.json",
      scorpionAmmo:
        "/pa/units/land/l_tank_laser_adv/l_tank_laser_adv_ammo.json",
      scorpionWeapon:
        "/pa/units/land/l_tank_laser_adv/l_tank_laser_adv_tool_weapon.json",
      scythe: "/pa/units/air/l_fighter/l_fighter.json",
      scytheAmmo: "/pa/units/air/l_fighter/l_fighter_ammo.json",
      scytheWeapon: "/pa/units/air/l_fighter/l_fighter_tool_weapon.json",
      seaUrchin: "/pa/units/sea/l_sea_mine/l_sea_mine.json",
      seaUrchinAmmo: "/pa/units/sea/l_sea_mine/l_sea_mine_ammo.json",
      seaUrchinWeapon: "/pa/units/sea/l_sea_mine/l_sea_mine_tool_weapon.json",
      shank: "/pa/units/land/l_tank_shank/l_tank_shank.json",
      shankAmmo: "/pa/units/land/l_tank_shank/l_tank_shank_ammo.json",
      shankWeapon: "/pa/units/land/l_tank_shank/l_tank_shank_tool_weapon.json",
      shipFoundry: "/pa/units/sea/l_naval_factory/l_naval_factory.json",
      shipFoundryAdvanced:
        "/pa/units/sea/l_naval_factory_adv/l_naval_factory_adv.json",
      shipFoundryAdvancedBuildArm:
        "/pa/units/sea/l_naval_factory_adv/l_naval_factory_adv_build_arm.json",
      shipFoundryBuildArm:
        "/pa/units/sea/l_naval_factory/l_naval_factory_build_arm.json",
      shredder: "/pa/units/land/l_air_defense/l_air_defense.json",
      shredderAmmo: "/pa/units/land/l_air_defense/l_air_defense_ammo.json",
      shredderBeamAmmo:
        "/pa/units/land/l_air_defense/l_air_defense_beam_ammo.json",
      shredderBeamWeapon:
        "/pa/units/land/l_air_defense/l_air_defense_beam_tool_weapon.json",
      shredderWeapon:
        "/pa/units/land/l_air_defense/l_air_defense_tool_weapon.json",
      skyBridge: "/pa/units/land/l_teleporter/l_teleporter.json",
      spectre: "/pa/units/orbital/l_orbital_probe/l_orbital_probe.json",
      spoiler: "/pa/units/land/l_land_mine/l_land_mine.json",
      spoilerTriggerAmmo:
        "/pa/units/land/l_land_mine/l_land_mine_trigger_ammo.json",
      spoilerTriggerWeapon:
        "/pa/units/land/l_land_mine/l_land_mine_trigger_tool_weapon.json",
      spoilerTriggered: "/pa/units/land/l_land_mine/triggered/l_land_mine.json",
      spoilerTriggeredAmmo:
        "/pa/units/land/l_land_mine/triggered/l_land_mine_ammo.json",
      spoilerTriggeredMainAmmo:
        "/pa/units/land/l_land_mine/triggered/l_land_mine_main_ammo.json",
      spoilerTriggeredMainWeapon:
        "/pa/units/land/l_land_mine/triggered/l_land_mine_main_tool_weapon.json",
      spoilerTriggeredWeapon:
        "/pa/units/land/l_land_mine/triggered/l_land_mine_tool_weapon.json",
      sputnik: "/pa/units/orbital/l_radar_satellite/l_radar_satellite.json",
      starcannon: "/pa/units/orbital/l_orbital_dropper/l_orbital_dropper.json",
      starcannonAmmo:
        "/pa/units/orbital/l_orbital_dropper/l_orbital_dropper_ammo.json",
      starcannonBuildArm:
        "/pa/units/orbital/l_orbital_dropper/l_orbital_dropper_build_arm.json",
      starcannonWeapon:
        "/pa/units/orbital/l_orbital_dropper/l_orbital_dropper_tool_weapon.json",
      starshipFoundry:
        "/pa/units/orbital/l_orbital_factory/l_orbital_factory.json",
      starshipFoundryBuildArm:
        "/pa/units/orbital/l_orbital_factory/l_orbital_factory_build_arm.json",
      starshipProjector:
        "/pa/units/orbital/l_orbital_launcher/l_orbital_launcher.json",
      starshipProjectorBuildArm:
        "/pa/units/orbital/orbital_launcher/orbital_launcher_build_arm.json",
      stoke: "/pa/units/land/l_mortar_tank/l_mortar_tank.json",
      stokeAmmo: "/pa/units/land/l_mortar_tank/l_mortar_tank_ammo.json",
      stokeTorpedoWaterAmmo:
        "/pa/units/land/l_mortar_tank/l_mortar_tank_torpedo_water_ammo.json",
      stokeTorpedoWeapon:
        "/pa/units/land/l_mortar_tank/l_mortar_tank_torpedo_tool_weapon.json",
      stokeWeapon:
        "/pa/units/land/l_mortar_tank/l_mortar_tank_tool_weapon.json",
      supernova: "/pa/units/land/l_nuke_launcher/l_nuke_launcher.json",
      supernovaAmmo: "/pa/units/land/l_nuke_launcher/l_nuke_launcher_ammo.json",
      supernovaBuildArm:
        "/pa/units/land/l_nuke_launcher/l_nuke_launcher_build_arm.json",
      supernovaWeapon:
        "/pa/units/land/l_nuke_launcher/l_nuke_launcher_tool_weapon.json",
      talos: "/pa/units/sea/l_frigate/l_frigate.json",
      talosAmmoAa: "/pa/units/sea/l_frigate/l_frigate_ammo_aa.json",
      talosWeaponAa: "/pa/units/sea/l_frigate/l_frigate_tool_weapon_aa.json",
      theodor: "/pa/units/land/l_artillery_short/l_artillery_short.json",
      theodorAmmo:
        "/pa/units/land/l_artillery_short/l_artillery_short_ammo.json",
      theodorWeapon:
        "/pa/units/land/l_artillery_short/l_artillery_short_tool_weapon.json",
      thor: "/pa/units/land/l_titan_bot/l_titan_bot.json",
      thorCannonAmmo: "/pa/units/land/l_titan_bot/l_titan_bot_cannon_ammo.json",
      thorCannonWeapon:
        "/pa/units/land/l_titan_bot/l_titan_bot_cannon_tool_weapon.json",
      thorMegaLaserAmmo:
        "/pa/units/land/l_titan_bot/l_titan_bot_mega_laser_ammo.json",
      thorMegaLaserWeapon:
        "/pa/units/land/l_titan_bot/l_titan_bot_mega_laser_tool_weapon.json",
      thorRocketAmmo: "/pa/units/land/l_titan_bot/l_titan_bot_rocket_ammo.json",
      thorRocketWeapon:
        "/pa/units/land/l_titan_bot/l_titan_bot_rocket_tool_weapon.json",
      timeDelayBomb: "/pa/units/land/l_bot_artillery/bomb/bomb.json",
      timeDelayBombAmmo: "/pa/units/land/l_bot_artillery/bomb/bomb_ammo.json",
      timeDelayBombWeapon:
        "/pa/units/land/l_bot_artillery/bomb/bomb_tool_weapon.json",
      tola: "/pa/units/orbital/l_ion_defense/l_ion_defense.json",
      tolaAmmo: "/pa/units/orbital/l_ion_defense/l_ion_defense_ammo.json",
      tolaAntidropAmmo:
        "/pa/units/orbital/l_ion_defense/l_ion_defense_antidrop_ammo.json",
      tolaToolAntidrop:
        "/pa/units/orbital/l_ion_defense/l_ion_defense_tool_antidrop.json",
      tolaWeapon:
        "/pa/units/orbital/l_ion_defense/l_ion_defense_tool_weapon.json",
      tsunami:
        "/pa/units/sea/l_torpedo_launcher_adv/l_torpedo_launcher_adv.json",
      tsunamiWaveAmmo:
        "/pa/units/sea/l_torpedo_launcher_adv/l_torpedo_launcher_adv_wave_ammo.json",
      tsunamiWaveWeapon:
        "/pa/units/sea/l_torpedo_launcher_adv/l_torpedo_launcher_adv_wave_tool_weapon.json",
      tyr: "/pa/units/orbital/l_titan_orbital/l_titan_orbital.json",
      tyrAmmo: "/pa/units/orbital/l_titan_orbital/l_titan_orbital_ammo.json",
      tyrEffectAmmo:
        "/pa/units/orbital/l_titan_orbital/l_titan_orbital_effect_ammo.json",
      tyrEffectWeapon:
        "/pa/units/orbital/l_titan_orbital/l_titan_orbital_effect_tool_weapon.json",
      tyrWeapon:
        "/pa/units/orbital/l_titan_orbital/l_titan_orbital_tool_weapon.json",
      viper: "/pa/units/orbital/l_orbital_fighter/l_orbital_fighter.json",
      viperAmmo:
        "/pa/units/orbital/l_orbital_fighter/l_orbital_fighter_ammo.json",
      viperWeapon:
        "/pa/units/orbital/l_orbital_fighter/l_orbital_fighter_tool_weapon.json",
      walkerFoundry: "/pa/units/land/l_bot_factory/l_bot_factory.json",
      walkerFoundryAdvanced:
        "/pa/units/land/l_bot_factory_adv/l_bot_factory_adv.json",
      walkerFoundryAdvancedBuildArm:
        "/pa/units/land/l_bot_factory_adv/l_bot_factory_adv_build_arm.json",
      walkerFoundryBuildArm:
        "/pa/units/land/l_bot_factory/l_bot_factory_build_arm.json",
    },
    mla: {
      akula: "barracuda",
      akulaAmmo: "barracudaAmmo",
      akulaWeapon: "barracudaWeapon",
      archer: "flak",
      archerAmmo: "flakAmmo",
      archerWeapon: "flakWeapon",
      armourFabricator: "vehicleFabber",
      armourFabricatorAdvanced: "vehicleFabberAdvanced",
      armourFabricatorAdvancedBuildArm: "vehicleFabberAdvancedBuildArm",
      armourFabricatorBuildArm: "vehicleFabberBuildArm",
      armourFoundry: "vehicleFactory",
      armourFoundryAdvanced: "vehicleFactoryAdvanced",
      armourFoundryAdvancedBuildArm: "vehicleFactoryAdvancedBuildArm",
      armourFoundryBuildArm: "vehicleFactoryBuildArm",
      blackKnight: "sxx",
      blackKnightAmmo: "sxxAmmo",
      blackKnightWeapon: "sxxWeapon",
      bowhead: "orca",
      bowheadAmmo: "orcaAmmo",
      bowheadWeapon: "orcaWeapon",
      catalyst: "catalyst",
      catfish: "piranha",
      catfishAmmo: "piranhaAmmo",
      catfishWeapon: "piranhaWeapon",
      centurion: "anchor",
      centurionAmmo: "anchorAmmoAG",
      centurionGroundAmmo: "anchorAmmoAO",
      centurionGroundWeapon: "anchorWeaponAO",
      centurionWeapon: "anchorWeaponAG",
      chariot: "astraeus",
      clot: "wall",
      commander: "commander",
      corsair: "drifter",
      corsairAmmo: "drifterAmmo",
      corsairWeapon: "drifterWeapon",
      dauntless: "bumblebee",
      dauntlessAmmo: "bumblebeeAmmo",
      dauntlessWeapon: "bumblebeeWeapon",
      deathmark: "nyx",
      decimator: "catapult",
      decimatorAmmo: ["catapultAmmo", "catapultBeamAmmo"],
      decimatorWeapon: ["catapultBeam", "catapultWeapon"],
      diplomat: "halley",
      earthshaker: "vanguard",
      earthshakerAmmo: "vanguardAmmo",
      earthshakerWeapon: "vanguardWeapon",
      enforcer: "slammer",
      enforcerAmmo: "slammerAmmo",
      enforcerWeapon: ["slammerTorpedo", "slammerWeapon"],
      epoch: "leviathan",
      epochUpperAmmo: "leviathanAmmo",
      epochUpperWeapon: "leviathanWeapon",
      fabricationFlyer: "airFabber",
      fabricationFlyerAdvanced: "airFabberAdvanced",
      fabricationFlyerAdvancedBuildArm: "airFabberAdvancedBuildArm",
      fabricationFlyerBuildArm: "airFabberBuildArm",
      fabricationStarship: "orbitalFabber",
      fabricationStarshipBuildArm: "orbitalFabberBuildArm",
      fabricationVessel: "navalFabber",
      fabricationVesselAdvanced: "navalFabberAdvanced",
      fabricationVesselAdvancedBuildArm: "navalFabberAdvancedBuildArm",
      fabricationVesselBuildArm: "navalFabberBuildArm",
      fabricationWalker: "botFabber",
      fabricationWalkerAdvanced: "botFabberAdvanced",
      fabricationWalkerAdvancedBuildArm: "botFabberAdvancedBuildArm",
      fabricationWalkerBuildArm: "botFabberBuildArm",
      firebird: "phoenix",
      firebirdAmmo: "phoenixAmmo",
      firebirdWeapon: "phoenixWeapon",
      flyerFoundry: "airFactory",
      flyerFoundryAdvanced: "airFactoryAdvanced",
      flyerFoundryAdvancedBuildArm: "airFactoryAdvancedBuildArm",
      flyerFoundryBuildArm: "airFactoryBuildArm",
      guardian: "stitch",
      guardianBuildArm: "stitchBuildArm",
      gustav: "holkins",
      gustavAmmo: "holkinsAmmo",
      gustavWeapon: "holkinsWeapon",
      hammerhead: "typhoon",
      hammerheadAmmo: "typhoonAmmo",
      hammerheadWeapon: "typhoonWeapon",
      havoc: "storm",
      havocAmmo: "stormAmmo",
      havocWeapon: "stormWeapon",
      holocene: "ragnarok",
      holocenePbaoe: "ragnarokPbaoe",
      holoceneWeapon: "ragnarokWeapon",
      imperator: "omega",
      imperatorAmmo: "omegaAmmo",
      imperatorAmmoGround: "omegaAmmoAG",
      imperatorWeapon: "omegaWeapon",
      imperatorWeaponGround: "omegaWeaponAG",
      infiltrator: "horsefly",
      infiltratorAmmo: "horseflyAmmo",
      infiltratorVisionWeapon: "horseflyWeapon",
      ironDome: "antiNukeLauncher",
      ironDomeAmmo: "antiNukeLauncherAmmo",
      ironDomeBuildArm: "antiNukeLauncherBuildArm",
      ironDomeWeapon: "antiNukeWeapon",
      jackal: "singleLaserDefenseTower",
      jackalAmmo: "singleLaserDefenseTowerAmmo",
      jackalWeapon: "singleLaserDefenseTowerWeapon",
      jaeger: "kaiju",
      jaegerAmmo: "kaijuAmmo",
      jaegerAmmoSide: "kaijuSecondaryAmmo",
      jaegerWeapon: "kaijuWeapon",
      jaegerWeaponSide: "kaijuSecondary",
      kosmos: "radarSatelliteAdvanced",
      lancer: "gilE",
      lancerAmmo: ["gilEAmmo", "gilEBeamAmmo"],
      lancerWeapon: ["gilEBeam", "gilEWeapon"],
      lockheed: "kestrel",
      lockheedMainAmmo: "kestrelAmmo",
      lockheedMainWeapon: "kestrelWeapon",
      loki: "zeus",
      lokiMainAmmo: "zeusAmmo",
      lokiMainWeapon: "zeusWeapon",
      manta: "stingray",
      mantaBeamAmmo: ["stingrayAAAmmo", "stingrayBeamAmmo"],
      mantaBeamWeapon: ["stingrayAA", "stingrayBeam"],
      mantaRocketAmmo: "stingrayAmmo",
      mantaRocketWeapon: "stingrayWeapon",
      marauder: "firefly",
      marauderAmmo: "fireflyAmmo",
      marauderWeapon: "fireflyWeapon",
      massExtractor: "metalExtractor",
      massExtractorAdvanced: "metalExtractorAdvanced",
      maul: "inferno",
      maulAmmo: "infernoAmmo",
      maulWeapon: "infernoWeapon",
      meteor: "wyrm",
      meteorAmmo: "wyrmAmmo",
      meteorWeapon: "wyrmWeapon",
      meteoroid: "squall",
      meteoroidAmmo: "squallAmmo",
      meteoroidWeapon: ["squallTorpedo", "squallWeapon"],
      miniman: "grenadier",
      minimanAmmo: "grenadierAmmo",
      minimanWeapon: "grenadierWeapon",
      monstrosity: "bluehawk",
      monstrosityAmmo: ["bluehawkAmmo", "bluehawkBeamAmmo"],
      monstrosityLightAmmo: "bluehawkAmmoOrbital",
      monstrosityLightWeapon: "bluehawkWeaponOrbital",
      monstrosityWeapon: ["bluehawkBeam", "bluehawkWeapon"],
      necromancer: "locusts",
      necromancerAmmo: "locustsAmmo",
      necromancerWeapon: "locustsWeapon",
      odin: "ares",
      odinAmmoMain: "aresAmmo",
      odinAmmoSide: "aresSecondaryAmmo",
      odinWeaponMain: "aresWeapon",
      odinWeaponSide: "aresSecondary",
      omniSilo: ["energyStorage", "metalStorage"],
      orbweaver: "spark",
      orbweaverAmmo: "sparkAmmo",
      orbweaverWeapon: "sparkWeapon",
      osprey: "pelican",
      overseer: "radarAdvanced",
      paladin: "artemis",
      paladinAmmo: "artemisAmmo",
      paladinWeapon: "artemisWeapon",
      panzer: "sheller",
      panzerAmmo: "shellerAmmo",
      panzerWeapon: "shellerWeapon",
      patriot: "stinger",
      patriotAmmo: "stingerAmmo",
      patriotWeapon: "stingerWeapon",
      peacekeeper: "dox",
      peacekeeperAmmo: "doxAmmo",
      peacekeeperWeapon: "doxWeapon",
      powerCatalyst: "energyPlant",
      powerCatalystAdvanced: "energyPlantAdvanced",
      praetorian: "colonel",
      praetorianAmmo: "colonelAmmo",
      praetorianToolBuildArm: "colonelBuildArm",
      praetorianWeapon: "colonelWeapon",
      purger: "boom",
      purgerAmmo: "boomAmmo",
      purgerWeapon: "boomWeapon",
      purifier: "laserDefenseTowerAdvanced",
      purifierAmmo: "laserDefenseTowerAdvancedAmmo",
      purifierWeapon: "laserDefenseTowerAdvancedWeapon",
      radar: "radar",
      remora: "barnacle",
      remoraBuildArm: "barnacleBuildArm",
      rig: "jig",
      ripple: "torpedoLauncher",
      rippleWaveWeapon: "torpedoLauncherWeapon",
      salamander: "hornet",
      scarab: "laserDefenseTower",
      scarabAmmo: "laserDefenseTowerAmmo",
      scarabWeapon: "laserDefenseTowerWeapon",
      scorpion: "leveler",
      scorpionAmmo: "levelerAmmo",
      scorpionWeapon: "levelerWeapon",
      scythe: "hummingbird",
      scytheAmmo: "hummingbirdAmmo",
      scytheWeapon: "hummingbirdWeapon",
      shank: "ant",
      shankAmmo: "antAmmo",
      shankWeapon: "antWeapon",
      shipFoundry: "navalFactory",
      shipFoundryAdvanced: "navalFactoryAdvanced",
      shipFoundryAdvancedBuildArm: "navalFactoryAdvancedBuildArm",
      shipFoundryBuildArm: "navalFactoryBuildArm",
      shredder: "galata",
      shredderAmmo: "galataAmmo",
      shredderWeapon: "galataWeapon",
      skyBridge: "teleporter",
      spectre: "hermes",
      spoiler: "landMine",
      spoilerTriggerAmmo: "landMineAmmo",
      spoilerTriggerWeapon: "landMineWeapon",
      sputnik: "arkyd",
      starcannon: "unitCannon",
      starcannonBuildArm: "unitCannonBuildArm",
      starcannonWeapon: "unitCannonWeapon",
      starshipFoundry: "orbitalFactory",
      starshipFoundryBuildArm: "orbitalFactoryBuildArm",
      starshipProjector: "orbitalLauncher",
      starshipProjectorBuildArm: "orbitalLauncherBuildArm",
      stoke: "stryker",
      stokeAmmo: "strykerAmmo",
      stokeWeapon: "strykerWeapon",
      supernova: "nukeLauncher",
      supernovaAmmo: "nukeLauncherAmmo",
      supernovaBuildArm: "nukeLauncherBuildArm",
      supernovaWeapon: "nukeLauncherWeapon",
      talos: "narwhal",
      talosAmmoAa: ["narwhalAAAmmo", "narwhalAmmo", "narwhalTorpedoAmmo"],
      talosWeaponAa: ["narwhalAA", "narwhalTorpedo", "narwhalWeapon"],
      theodor: "pelter",
      theodorAmmo: "pelterAmmo",
      theodorWeapon: "pelterWeapon",
      thor: "atlas",
      thorCannonAmmo: "atlasAmmo",
      thorCannonWeapon: "atlasWeapon",
      tola: "umbrella",
      tolaAmmo: "umbrellaAmmo",
      tolaAntidropAmmo: "umbrellaBeamAmmo",
      tolaToolAntidrop: "umbrellaBeam",
      tolaWeapon: "umbrellaWeapon",
      tsunami: "torpedoLauncherAdvanced",
      tsunamiWaveWeapon: "torpedoLauncherAdvancedWeapon",
      tyr: "helios",
      tyrAmmo: "heliosAmmo",
      tyrWeapon: "heliosWeapon",
      viper: "avenger",
      viperAmmo: "avengerAmmo",
      viperWeapon: "avengerWeapon",
      walkerFoundry: "botFactory",
      walkerFoundryAdvanced: "botFactoryAdvanced",
      walkerFoundryAdvancedBuildArm: "botFactoryAdvancedBuildArm",
      walkerFoundryBuildArm: "botFactoryBuildArm",
    },
    unitNames: {
      akula: "!LOC:Akula",
      aoeNova: "!LOC:AOE Nova",
      archer: "!LOC:Archer",
      armourFabricator: "!LOC:Armour Fabricator",
      armourFabricatorAdvanced: "!LOC:Advanced Armour Fabricator",
      armourFoundry: "!LOC:Armour Foundry",
      armourFoundryAdvanced: "!LOC:Advanced Armour Foundry",
      arsonist: "!LOC:Arsonist",
      blackKnight: "!LOC:Black Knight",
      boombotCocoon: "Boombot Cocoon",
      bowhead: "!LOC:Bowhead",
      cameraTarget: "!LOC:Camera Target",
      catalyst: "!LOC:Catalyst",
      catfish: "!LOC:Catfish",
      centurion: "!LOC:Centurion",
      chariot: "!LOC:Chariot",
      clot: "!LOC:Clot",
      comet: "!LOC:Comet",
      commander: "Legion Class Commander",
      corsair: "!LOC:Corsair",
      dauntless: "!LOC:Dauntless",
      deathmark: "!LOC:Deathmark",
      decimator: "!LOC:Decimator",
      diplomat: "!LOC:Diplomat",
      earthshaker: "!LOC:Earthshaker",
      enforcer: "!LOC:Enforcer",
      epoch: "!LOC:Epoch",
      fabricationFlyer: "!LOC:Fabrication Flyer",
      fabricationFlyerAdvanced: "!LOC:Advanced Fabrication Flyer",
      fabricationStarship: "!LOC:Fabrication Starship",
      fabricationVessel: "!LOC:Fabrication Vessel",
      fabricationVesselAdvanced: "!LOC:Advanced Fabrication Vessel",
      fabricationWalker: "!LOC:Fabrication Walker",
      fabricationWalkerAdvanced: "!LOC:Advanced Fabrication Walker",
      firebird: "!LOC:Firebird",
      flyerFoundry: "!LOC:Flyer Foundry",
      flyerFoundryAdvanced: "!LOC:Advanced Flyer Foundry",
      guardian: "!LOC:Guardian",
      gustav: "!LOC:Gustav",
      hammerhead: "!LOC:Hammerhead",
      havoc: "!LOC:Havoc",
      hive: "!LOC:Hive",
      holocene: "!LOC:Holocene",
      imperator: "!LOC:Imperator",
      imperatorMeteoroid: "!LOC:Meteoroid",
      infiltrator: "!LOC:Infiltrator",
      investigator: "!LOC:Investigator",
      investigatorRadar: "!LOC:Investigator Radar",
      investigatorRadarCollisionCheck:
        "!LOC:Investigator Radar Collision Check",
      ironDome: "!LOC:Iron Dome",
      jackal: "!LOC:Jackal",
      jaeger: "!LOC:Jaeger",
      kosmos: "!LOC:Kosmos",
      lancer: "!LOC:Lancer",
      lockheed: "!LOC:Lockheed",
      loki: "!LOC:Loki",
      manta: "!LOC:Manta",
      marauder: "!LOC:Marauder",
      massExtractor: "!LOC:Mass Extractor",
      massExtractorAdvanced: "!LOC:Advanced Mass Extractor",
      maul: "!LOC:Maul",
      meteor: "!LOC:Meteor",
      meteoroid: "!LOC:Meteoroid",
      miniman: "!LOC:Miniman",
      monstrosity: "!LOC:Monstrosity",
      nanoswarm: "!LOC:Nanoswarm",
      necromancer: "!LOC:Necromancer",
      necromancerPurger: "!LOC:Purger",
      nova: "!LOC:Nova",
      odin: "!LOC:Odin",
      omniSilo: "!LOC:OmniSilo Storage Device",
      orbweaver: "!LOC:Orbweaver",
      osprey: "!LOC:Osprey",
      overseer: "!LOC:Overseer",
      paladin: "!LOC:Paladin",
      panzer: "!LOC:Panzer",
      patriot: "!LOC:Patriot",
      peacekeeper: "!LOC:Peacekeeper",
      powerCatalyst: "!LOC:Power Catalyst",
      powerCatalystAdvanced: "!LOC:Advanced Power Catalyst",
      praetorian: "!LOC:Praetorian",
      purger: "!LOC:Purger",
      purifier: "!LOC:Purifier",
      purifierCollisionCheck: "!LOC:Purifier Collision Check",
      radar: "!LOC:Radar",
      rampart: "!LOC:Rampart",
      remora: "!LOC:Remora",
      rig: "!LOC:Rig",
      ripple: "!LOC:Ripple",
      salamander: "!LOC:Salamander",
      scarab: "!LOC:Scarab",
      scorpion: "!LOC:Scorpion",
      scythe: "!LOC:Scythe",
      seaUrchin: "!LOC:Sea Urchin",
      shank: "!LOC:Shank",
      shipFoundry: "!LOC:Ship Foundry",
      shipFoundryAdvanced: "!LOC:Advanced Ship Foundry",
      shredder: "!LOC:Shredder",
      skyBridge: "!LOC:Sky Bridge",
      spectre: "!LOC:Spectre",
      spoiler: "!LOC:Spoiler",
      spoilerTriggered: "!LOC:Spoiler",
      sputnik: "!LOC:Sputnik",
      starcannon: "!LOC:Starcannon",
      starshipFoundry: "!LOC:Starship Foundry",
      starshipProjector: "!LOC:Starship Projector",
      stoke: "!LOC:Stoke",
      supernova: "!LOC:Supernova",
      talos: "!LOC:Talos",
      theodor: "!LOC:Theodor",
      thor: "!LOC:Thor",
      timeDelayBomb: "Time Delay Bomb",
      tola: "!LOC:Tola",
      tsunami: "!LOC:Tsunami",
      tyr: "!LOC:Tyr",
      viper: "!LOC:Viper",
      walkerFoundry: "!LOC:Walker Foundry",
      walkerFoundryAdvanced: "!LOC:Advanced Walker Foundry",
    },
  };
});
