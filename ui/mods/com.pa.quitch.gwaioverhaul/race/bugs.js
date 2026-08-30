// The Bug Faction as a Galactic War race. Commanders and AI data are what the
// mod ships. `units` names every Bugs spec by a Bugs key (the same shape as
// shared/units.js, so Bugs-only cards can address them) and `unitNames`
// carries the display names by Bugs key. What a Bugs player fields for the
// vanilla units held follows from capability cells - including the research
// unlock tokens its research factories build. See races.md and
// race-conventions.md.
define(function () {
  return {
    id: "bugs",
    name: "!LOC:Bugs",
    // The companion commander-merge mod supplies the commander's base spec
    // (the Custom2 bit and build list); the bugs zip needs it either way.
    serverMods: ["com.pa.ferretmaster.bugs"],
    unitTypeBit: "Custom2",
    // The preview art ships in the green team paint.
    commanderArtHue: 120,
    commanderTypes: {
      unitType: "UNITTYPE_Custom2",
      buildable: "CmdBuild & Custom2",
    },
    commanders: [
      { spec: "/pa/units/commanders/bug_commander/bug_commander.json" },
    ],
    // The client mod ships the same two files Exiles does, under Exiles'
    // name; distinct art is the mod author's call.
    playerIcon: {
      fill: "coui://ui/mods/bugs_faction/img/exiles_icon_fill.png",
      outline: "coui://ui/mods/bugs_faction/img/exiles_icon_outline.png",
    },
    ai: {
      // bugs/ sub-directories under each build directory, one unit map, one
      // platoon template file.
      titans: {
        unitMaps: ["/pa/ai/unit_maps/bugs.json"],
        sources: [
          { dir: "/pa/ai/fabber_builds/", match: "bugs/" },
          { dir: "/pa/ai/factory_builds/", match: "bugs/" },
          { dir: "/pa/ai/platoon_builds/", match: "bugs/" },
          { dir: "/pa/ai/platoon_templates/", match: "bugs.json" },
        ],
      },
    },
    units: {
      acidTurret: "/pa/units/structure/bug_turret_acid/bug_turret_acid.json",
      acidTurretAmmo:
        "/pa/units/structure/bug_turret_acid/bug_turret_acid_ammo.json",
      acidTurretWeapon:
        "/pa/units/structure/bug_turret_acid/bug_turret_acid_weapon.json",
      airHiveAdvanced:
        "/pa/units/structure/advanced_air_hive/advanced_air_hive.json",
      alphaBoomer: "/pa/units/land/bug_boomer_big/bug_boomer_big.json",
      alphaBoomerAmmo: "/pa/units/land/bug_boomer_big/bug_boomer_big_ammo.json",
      alphaBoomerWeapon:
        "/pa/units/land/bug_boomer_big/bug_boomer_big_weapon.json",
      anchor: "/pa/units/structure/bug_anchor/bug_anchor.json",
      antiNukeLauncher: "/pa/units/structure/bug_anti_nuke/bug_anti_nuke.json",
      antiNukeLauncherLauncherWeapon:
        "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher_tool_weapon.json",
      arkyd: "/pa/units/orbital/bug_orbital_radar/bug_orbital_radar.json",
      assaultRipper:
        "/pa/units/orbital/bug_orbital_battleship/bug_land_drone/bug_land_drone.json",
      assaultRipperAmmo:
        "/pa/units/orbital/bug_orbital_battleship/bug_land_drone/bug_land_drone_ammo.json",
      assaultRipperDeathAmmo:
        "/pa/units/orbital/bug_orbital_battleship/bug_land_drone/bug_land_drone_death_ammo.json",
      assaultRipperDeathWeapon:
        "/pa/units/orbital/bug_orbital_battleship/bug_land_drone/bug_land_drone_death_weapon.json",
      assaultRipperWeapon:
        "/pa/units/orbital/bug_orbital_battleship/bug_land_drone/bug_land_drone_weapon.json",
      astraeus: "/pa/units/orbital/bug_lander/bug_lander.json",
      baseAdvUnlock:
        "/pa/units/research/unlocks/base_unlock/base_adv_research.json",
      baseCommander:
        "/pa/units/commanders/base_bug_commander/base_commander.json",
      baseUnitUnlock: "/pa/units/research/unlocks/base_unlock/base_unlock.json",
      baseUnlock: "/pa/units/research/unlocks/base_unlock/base_research.json",
      basicAirHive: "/pa/units/structure/basic_air_hive/basic_air_hive.json",
      basicHive: "/pa/units/structure/basic_hive/basic_hive.json",
      basilisk: "/pa/units/air/bug_basilisk/bug_basilisk.json",
      basiliskAmmo: "/pa/units/air/bug_basilisk/bug_basilisk_ammo.json",
      basiliskWeapon: "/pa/units/air/bug_basilisk/bug_basilisk_weapon.json",
      behemoth:
        "/pa/units/orbital/bug_orbital_battleship/bug_orbital_battleship.json",
      behemothAmmo:
        "/pa/units/orbital/bug_orbital_battleship/bug_orbital_battleship_ammo.json",
      behemothWeapon:
        "/pa/units/orbital/bug_orbital_battleship/bug_orbital_battleship_weapon.json",
      belcher: "/pa/units/land/bug_belcher/bug_belcher.json",
      belcherAmmo: "/pa/units/land/bug_belcher/bug_belcher_ammo.json",
      belcherWeapon: "/pa/units/land/bug_belcher/bug_belcher_weapon.json",
      bigBoomerEgg: "/pa/units/structure/bug_mine_big/bug_mine_big.json",
      bigBoomerEggAmmo:
        "/pa/units/structure/bug_mine_big/bug_mine_big_ammo.json",
      bigBoomerEggWeapon:
        "/pa/units/structure/bug_mine_big/bug_mine_big_weapon.json",
      bombardier: "/pa/units/land/bug_gren/bug_gren.json",
      bombardierAmmo: "/pa/units/land/bug_gren/bug_gren_ammo.json",
      bombardierWeapon: "/pa/units/land/bug_gren/bug_gren_weapon.json",
      boomer: "/pa/units/land/bug_boomer/bug_boomer.json",
      boomerAmmo: "/pa/units/land/bug_boomer/bug_boomer_ammo.json",
      boomerDeathExplosion:
        "/pa/units/land/bug_boomer/bug_boomer_death_explosion.json",
      boomerEgg: "/pa/units/structure/bug_mine/bug_mine.json",
      boomerEggAltAmmo: "/pa/units/structure/bug_mine/bug_mine_alt_ammo.json",
      boomerEggAltWeapon:
        "/pa/units/structure/bug_mine/bug_mine_alt_weapon.json",
      boomerEggAmmo: "/pa/units/structure/bug_mine/bug_mine_ammo.json",
      boomerEggWeapon: "/pa/units/structure/bug_mine/bug_mine_weapon.json",
      boomerMineResearch:
        "/pa/units/research/unlocks/bug_boomer_mine_unlock/research_boomer_mine.json",
      boomerMineResearchBuildArm:
        "/pa/units/research/basic_research_station/basic_research_station_build_arm.json",
      boomerMineUnlock:
        "/pa/units/research/unlocks/bug_boomer_mine_unlock/bug_boomer_mine_unlock.json",
      boomerWeapon: "/pa/units/land/bug_boomer/bug_boomer_weapon.json",
      boomerbugBoomer: "/pa/units/land/bug_boomer/bug_boomer_r.json",
      boomerbugBoomerAltAmmo:
        "/pa/units/land/bug_boomer/bug_boomer_alt_ammo.json",
      boomerbugBoomerAltWeapon:
        "/pa/units/land/bug_boomer/bug_boomer_alt_weapon.json",
      cataclysm: "/pa/units/structure/bug_rag/bug_rag.json",
      cataclysmAmmo: "/pa/units/structure/bug_rag/bug_rag_ammo.json",
      cataclysmWeapon: "/pa/units/structure/bug_rag/bug_rag_weapon.json",
      catalyst: "/pa/units/structure/bug_catalyst/bug_catalyst.json",
      chargingPortal:
        "/pa/units/structure/control_node/portal/portal_charging.json",
      chargingPortalCompleteAmmo:
        "/pa/units/structure/control_node/portal/portal_complete_ammo.json",
      chargingPortalWeapon:
        "/pa/units/structure/control_node/portal/portal_charging_weapon.json",
      cheapCombatFabResearch:
        "/pa/units/research/unlocks/bug_combat_fab_cheap_unlock/research_combat_fab.json",
      cheapCombatFabUnlock:
        "/pa/units/research/unlocks/bug_combat_fab_cheap_unlock/bug_combat_fab_cheap_unlock.json",
      chomper: "/pa/units/orbital/bug_orbital_chomper/bug_orbital_chomper.json",
      chomperAmmo:
        "/pa/units/orbital/bug_orbital_chomper/bug_orbital_chomper_ammo.json",
      chomperResearch:
        "/pa/units/research/unlocks/bug_chomper_unlock/research_bug_chomper.json",
      chomperUnlock:
        "/pa/units/research/unlocks/bug_chomper_unlock/bug_chomper_unlock.json",
      chomperWeapon:
        "/pa/units/orbital/bug_orbital_chomper/bug_orbital_chomper_weapon.json",
      corvus: "/pa/units/air/bug_transport/bug_transport.json",
      crusher: "/pa/units/land/bug_crusher/bug_crusher.json",
      crusherAmmo: "/pa/units/land/bug_crusher/bug_crusher_ammo.json",
      crusherResearch:
        "/pa/units/research/unlocks/bug_crusher_unlock/research_crusher.json",
      crusherResearchBuildArm:
        "/pa/units/research/advanced_research_station/advanced_research_station_build_arm.json",
      crusherUnlock:
        "/pa/units/research/unlocks/bug_crusher_unlock/bug_crusher_unlock.json",
      crusherWeapon: "/pa/units/land/bug_crusher/bug_crusher_weapon.json",
      energyPlant: "/pa/units/structure/bug_basic_energy/bug_basic_energy.json",
      energyPlantAdvanced:
        "/pa/units/structure/bug_advanced_energy/bug_advanced_energy.json",
      fab: "/pa/units/land/bug_bot_fab/bug_bot_fab.json",
      fabAircraftAdvanced: "/pa/units/air/bug_air_fab_adv/bug_air_fab_adv.json",
      fabBuildArm: "/pa/units/land/bug_bot_fab/bug_bot_fab_build_arm.json",
      fabricationAircraft: "/pa/units/air/bug_air_fab/bug_air_fab.json",
      fabricationBotAdvanced:
        "/pa/units/land/bug_bot_fab_advanced/bug_bot_fab_advanced.json",
      fabricationBotAdvancedBuildArm:
        "/pa/units/land/bug_bot_fab_advanced/bug_bot_fab_advanced_build_arm.json",
      fabricationShip: "/pa/units/sea/bug_ship_fab/bug_ship_fab.json",
      fabricationShipAdvanced:
        "/pa/units/sea/bug_ship_fab_adv/bug_ship_fab_adv.json",
      fastNeedlerResearch:
        "/pa/units/research/unlocks/bug_needler_fast_unlock/research_needler.json",
      fastNeedlerUnlock:
        "/pa/units/research/unlocks/bug_needler_fast_unlock/bug_needler_fast_unlock.json",
      fighter: "/pa/units/air/bug_fighter/bug_fighter.json",
      fighterAmmo: "/pa/units/air/bug_fighter/bug_fighter_ammo.json",
      fighterWeapon: "/pa/units/air/bug_fighter/bug_fighter_weapon.json",
      firefly: "/pa/units/air/bug_air_scout/bug_air_scout.json",
      forager: "/pa/units/land/bug_combat_fab/bug_combat_fab.json",
      foragerBuildArm:
        "/pa/units/land/bug_combat_fab/bug_combat_fab_build_arm.json",
      foragerbugCombatFab:
        "/pa/units/land/bug_combat_fab/bug_combat_fab_cheap.json",
      gasHive: "/pa/units/structure/bug_gas_hive/bug_gas_hive.json",
      grunt: "/pa/units/land/bug_grunt/bug_grunt.json",
      gruntWeapon: "/pa/units/land/bug_grunt/bug_grunt_weapon.json",
      halley: "/pa/units/structure/bug_halley/bug_halley.json",
      harpy: "/pa/units/air/bug_harpy/bug_harpy.json",
      harpyAmmo: "/pa/units/air/bug_harpy/bug_harpy_ammo.json",
      harpyWeapon: "/pa/units/air/bug_harpy/bug_harpy_weapon.json",
      heavyAATurret: "/pa/units/structure/bug_aa_large/bug_aa_large.json",
      heavyAATurretAmmo: "/pa/units/land/bug_aa_big/bug_aa_big_ammo.json",
      heavyAATurretWeapon:
        "/pa/units/structure/bug_aa_large/bug_aa_large_weapon.json",
      hiveAdvanced: "/pa/units/structure/advanced_hive/advanced_hive.json",
      holkins: "/pa/units/structure/bug_arty_large/bug_arty_large.json",
      holkinsAmmo:
        "/pa/units/structure/bug_arty_large/bug_arty_large_ammo.json",
      holkinsWeapon:
        "/pa/units/structure/bug_arty_large/bug_arty_large_weapon.json",
      hydra: "/pa/units/land/bug_hydra/bug_hydra.json",
      hydraAmmo: "/pa/units/land/bug_hydra/bug_hydra_ammo.json",
      hydraResearch:
        "/pa/units/research/unlocks/bug_hydra_unlock/research_hydra.json",
      hydraUnlock:
        "/pa/units/research/unlocks/bug_hydra_unlock/bug_hydra_unlock.json",
      hydraWeapon: "/pa/units/land/bug_hydra/bug_hydra_weapon.json",
      jig: "/pa/units/structure/bug_jig/bug_jig.json",
      landedBugOrbitalFabricator:
        "/pa/units/orbital/bug_orbital_fabricator/bug_orbital_fabricator_landed.json",
      landedBugOrbitalFabricatorAmmo:
        "/pa/units/orbital/bug_orbital_fabricator/bug_orbital_fabricator_landed_ammo.json",
      landedBugOrbitalFabricatorBuildArmLanded:
        "/pa/units/orbital/bug_orbital_fabricator/bug_orbital_fabricator_build_arm_landed.json",
      landedBugOrbitalFabricatorWeapon:
        "/pa/units/orbital/bug_orbital_fabricator/bug_orbital_fabricator_landed_weapon.json",
      largeSpitterTurret:
        "/pa/units/structure/bug_turret_large/bug_turret_large.json",
      largeSpitterTurretAmmo:
        "/pa/units/structure/bug_turret_large/bug_turret_large_ammo.json",
      largeSpitterTurretWeapon:
        "/pa/units/structure/bug_turret_large/bug_turret_large_weapon.json",
      laserPlatform:
        "/pa/units/orbital/bug_orbital_laser/bug_orbital_laser.json",
      laserPlatformAmmo:
        "/pa/units/orbital/bug_orbital_laser/bug_orbital_laser_ammo.json",
      laserPlatformWeapon:
        "/pa/units/orbital/bug_orbital_laser/bug_orbital_laser_weapon.json",
      lightAATurret: "/pa/units/structure/bug_aa_small/bug_aa_small.json",
      lightAATurretAmmo: "/pa/units/land/bug_aa/bug_aa_ammo.json",
      lightAATurretWeapon:
        "/pa/units/structure/bug_aa_small/bug_aa_small_weapon.json",
      lilu: "/pa/units/structure/bug_air_drone_launcher/bug_air_drone/bug_air_drone.json",
      liluAmmo:
        "/pa/units/structure/bug_air_drone_launcher/bug_air_drone/bug_air_drone_ammo.json",
      liluDeathWeapon:
        "/pa/units/structure/bug_air_drone_launcher/bug_air_drone/bug_air_drone_death_weapon.json",
      liluNest:
        "/pa/units/structure/bug_air_drone_launcher/bug_air_drone_launcher.json",
      liluNestAmmo:
        "/pa/units/structure/bug_air_drone_launcher/bug_air_drone_launcher_ammo.json",
      liluNestWeapon:
        "/pa/units/structure/bug_air_drone_launcher/bug_air_drone_launcher_weapon.json",
      liluWeapon:
        "/pa/units/structure/bug_air_drone_launcher/bug_air_drone/bug_air_drone_weapon.json",
      manticore: "/pa/units/land/bug_manticore/bug_manticore.json",
      manticoreAmmo: "/pa/units/land/bug_manticore/bug_manticore_ammo.json",
      manticoreWeapon: "/pa/units/land/bug_manticore/bug_manticore_weapon.json",
      matriarch: "/pa/units/land/bug_matriarch/bug_matriarch.json",
      matriarchAmmo: "/pa/units/land/bug_matriarch/bug_matriarch_ammo.json",
      matriarchProjectileAmmo:
        "/pa/units/land/bug_matriarch/bug_matriarch_projectile_ammo.json",
      matriarchProjectileWeapon:
        "/pa/units/land/bug_matriarch/bug_matriarch_projectile_weapon.json",
      matriarchWeapon: "/pa/units/land/bug_matriarch/bug_matriarch_weapon.json",
      medusa: "/pa/units/air/bug_bomber/bug_bomber.json",
      medusaAmmo: "/pa/units/air/bug_bomber/bug_bomber_ammo.json",
      medusaWeapon: "/pa/units/air/bug_bomber/bug_bomber_weapon.json",
      metalExtractor:
        "/pa/units/structure/bug_basic_extractor/bug_basic_extractor.json",
      metalExtractorAdvanced:
        "/pa/units/structure/bug_advanced_extractor/bug_advanced_extractor.json",
      navalFactory:
        "/pa/units/structure/basic_naval_hive/basic_naval_hive.json",
      navalFactoryAdvanced:
        "/pa/units/structure/advanced_naval_hive/advanced_naval_hive.json",
      needleTurret:
        "/pa/units/structure/bug_turret_needle/bug_turret_needle.json",
      needleTurretAmmo:
        "/pa/units/structure/bug_turret_needle/bug_turret_needle_ammo.json",
      needleTurretWeapon:
        "/pa/units/structure/bug_turret_needle/bug_turret_needle_weapon.json",
      needler: "/pa/units/land/bug_needler/bug_needler.json",
      needlerAmmo: "/pa/units/land/bug_needler/bug_needler_ammo.json",
      needlerWeapon: "/pa/units/land/bug_needler/bug_needler_weapon.json",
      needlerbugNeedler: "/pa/units/land/bug_needler/bug_needler_fast.json",
      nug: "/pa/units/land/bug_titan/bug_titan.json",
      nugWeapon: "/pa/units/land/bug_titan/bug_titan_weapon.json",
      orbitalCarrierResearch:
        "/pa/units/research/unlocks/bug_orbital_battleship_unlock/research_bug_orbital_battleship.json",
      orbitalCarrierUnlock:
        "/pa/units/research/unlocks/bug_orbital_battleship_unlock/bug_orbital_battleship_unlock.json",
      orbitalFab:
        "/pa/units/orbital/bug_orbital_fabricator/bug_orbital_fabricator.json",
      orbitalFabBuildArm:
        "/pa/units/orbital/bug_orbital_fabricator/bug_orbital_fabricator_build_arm.json",
      orbitalFabTransform:
        "/pa/units/orbital/bug_orbital_fabricator/bug_orbital_fabricator_transform.json",
      orbitalFabTransformAmmo:
        "/pa/units/orbital/bug_orbital_fabricator/bug_orbital_fabricator_transform_ammo.json",
      orbitalFabTransformRange:
        "/pa/units/orbital/bug_orbital_fabricator/bug_orbital_fabricator_transform_range.json",
      orbitalFighterVisionResearch:
        "/pa/units/research/unlocks/bug_orbital_fighter_vision_unlock/research_bug_orbital_fighter_vision.json",
      orbitalFighterVisionUnlock:
        "/pa/units/research/unlocks/bug_orbital_fighter_vision_unlock/bug_orbital_fighter_vision_unlock.json",
      orbitalLaserResearch:
        "/pa/units/research/unlocks/bug_orbital_laser_unlock/research_bug_orbital_laser.json",
      orbitalLaserUnlock:
        "/pa/units/research/unlocks/bug_orbital_laser_unlock/bug_orbital_laser_unlock.json",
      orbitalMine: "/pa/units/orbital/bug_orbital_mine/bug_orbital_mine.json",
      orbitalMineAmmo:
        "/pa/units/orbital/bug_orbital_mine/bug_orbital_mine_ammo.json",
      orbitalMineWeapon:
        "/pa/units/orbital/bug_orbital_mine/bug_orbital_mine_weapon.json",
      orbitalRadarUnlockAdvancedResearch:
        "/pa/units/research/unlocks/bug_advanced_orbital_radar_unlock/research_bug_advanced_orbital_radar.json",
      orbitalRadarUnlockAdvancedUnlock:
        "/pa/units/research/unlocks/bug_advanced_orbital_radar_unlock/bug_advanced_orbital_radar_unlock.json",
      pariahControlNode: "/pa/units/structure/control_node/control_node.json",
      pariahControlNodeBuildArm:
        "/pa/units/structure/control_node/control_node_build_arm.json",
      pelter: "/pa/units/structure/bug_arty_small/bug_arty_small.json",
      phoenix: "/pa/units/air/bug_fighter_adv/bug_fighter_adv.json",
      phoenixAmmo: "/pa/units/air/bug_fighter_adv/bug_fighter_adv_ammo.json",
      phoenixWeapon:
        "/pa/units/air/bug_fighter_adv/bug_fighter_adv_weapon.json",
      pike: "/pa/units/structure/bug_missile_defence_basic/bug_missile_defence_basic.json",
      pikeAmmo:
        "/pa/units/structure/bug_missile_defence_basic/bug_missile_defence_basic_ammo.json",
      pikeAntidrop:
        "/pa/units/structure/bug_missile_defence_basic/bug_missile_defence_basic_antidrop.json",
      pikeAntidropAmmo:
        "/pa/units/structure/bug_missile_defence_basic/bug_missile_defence_basic_antidrop_ammo.json",
      pikeWeapon:
        "/pa/units/structure/bug_missile_defence_basic/bug_missile_defence_basic_weapon.json",
      portalRing: "/pa/units/structure/control_node/portal/portal.json",
      portalRingDeathAmmo:
        "/pa/units/structure/bug_air_drone_launcher/bug_air_drone/bug_air_drone_death_ammo.json",
      portalRingSuicideWeapon:
        "/pa/units/structure/control_node/portal/portal_suicide_weapon.json",
      radar: "/pa/units/structure/bug_radar/bug_radar.json",
      radarAdvanced:
        "/pa/units/structure/bug_radar_advanced/bug_radar_advanced.json",
      radarAdvancedDummyAmmo:
        "/pa/units/structure/bug_radar/bug_radar_dummy_ammo.json",
      radarAdvancedDummyWeapon:
        "/pa/units/structure/bug_radar_advanced/bug_radar_advanced_dummy_weapon.json",
      radarDummyWeapon:
        "/pa/units/structure/bug_radar/bug_radar_dummy_weapon.json",
      radarSatelliteAdvanced:
        "/pa/units/orbital/bug_advanced_orbital_radar/bug_advanced_orbital_radar.json",
      rak: "/pa/units/land/bug_laser_spider/bug_laser_spider.json",
      rakAmmo: "/pa/units/land/bug_laser_spider/bug_laser_spider_ammo.json",
      rakWeapon: "/pa/units/land/bug_laser_spider/bug_laser_spider_weapon.json",
      ripper: "/pa/units/land/bug_ripper/bug_ripper.json",
      ripperAmmo: "/pa/units/land/bug_ripper/bug_ripper_ammo.json",
      ripperWeapon: "/pa/units/land/bug_ripper/bug_ripper_weapon.json",
      runner: "/pa/units/land/bug_runner/bug_runner.json",
      scorcher: "/pa/units/land/bug_scorcher/bug_scorcher.json",
      scorcherAmmo: "/pa/units/land/bug_scorcher/bug_scorcher_ammo.json",
      scorcherWeapon: "/pa/units/land/bug_scorcher/bug_scorcher_weapon.json",
      scourgeToxinLauncher: "/pa/units/structure/bug_nuke/bug_nuke.json",
      scourgeToxinLauncherAmmo:
        "/pa/units/structure/bug_nuke/ammo/bug_nuke_ammo.json",
      scourgeToxinLauncherWeapon:
        "/pa/units/structure/bug_nuke/bug_nuke_weapon.json",
      seeker: "/pa/units/orbital/bug_orbital_fighter/bug_orbital_fighter.json",
      seekerAmmo:
        "/pa/units/orbital/bug_orbital_fighter/bug_orbital_fighter_ammo.json",
      seekerWeapon:
        "/pa/units/orbital/bug_orbital_fighter/bug_orbital_fighter_weapon.json",
      seekerbugOrbitalFighter:
        "/pa/units/orbital/bug_orbital_fighter/bug_orbital_fighter_vision.json",
      smallSpitterTurret:
        "/pa/units/structure/bug_turret_small/bug_turret_small.json",
      smallSpitterTurretAmmo:
        "/pa/units/structure/bug_turret_small/bug_turret_small_ammo.json",
      smallSpitterTurretWeapon:
        "/pa/units/structure/bug_turret_small/bug_turret_small_weapon.json",
      sniper: "/pa/units/land/bug_sniper/bug_sniper.json",
      sniperAmmo: "/pa/units/land/bug_sniper/bug_sniper_ammo.json",
      sniperBeamAmmo: "/pa/units/land/bug_sniper/bug_sniper_beam_ammo.json",
      sniperWeapon: "/pa/units/land/bug_sniper/bug_sniper_weapon.json",
      sniperWeaponBeam: "/pa/units/land/bug_sniper/bug_sniper_weapon_beam.json",
      spire:
        "/pa/units/structure/bug_orbital_launcher/bug_orbital_launcher.json",
      stealthRipper:
        "/pa/units/land/bug_ripper_stealth/bug_ripper_stealth.json",
      stealthRipperAmmo:
        "/pa/units/land/bug_ripper_stealth/bug_ripper_stealth_ammo.json",
      stealthRipperMetalAmmo:
        "/pa/units/land/bug_ripper_stealth/bug_ripper_stealth_metal_ammo.json",
      stealthRipperMetalWeapon:
        "/pa/units/land/bug_ripper_stealth/bug_ripper_stealth_metal_weapon.json",
      stealthRipperResearch:
        "/pa/units/research/unlocks/bug_ripper_stealth_unlock/research_ripper.json",
      stealthRipperUnlock:
        "/pa/units/research/unlocks/bug_ripper_stealth_unlock/bug_ripper_stealth_unlock.json",
      stealthRipperWeapon:
        "/pa/units/land/bug_ripper_stealth/bug_ripper_stealth_weapon.json",
      stealthTurret:
        "/pa/units/structure/bug_stealth_turret/bug_stealth_turret.json",
      stealthTurretAmmo:
        "/pa/units/structure/bug_stealth_turret/bug_stealth_turret_ammo.json",
      stealthTurretWeapon:
        "/pa/units/structure/bug_stealth_turret/bug_stealth_turret_weapon.json",
      stheno: "/pa/units/air/bug_bomber_adv/bug_bomber_adv.json",
      sthenoAmmo: "/pa/units/air/bug_bomber_adv/bug_bomber_adv_ammo.json",
      sthenoWeapon: "/pa/units/air/bug_bomber_adv/bug_bomber_adv_weapon.json",
      storage:
        "/pa/units/structure/bug_combined_storage/bug_combined_storage.json",
      swarmHive: "/pa/units/structure/bug_swarm_hive/bug_swarm_hive.json",
      swarmHiveBuildArm:
        "/pa/units/structure/bug_swarm_hive/bug_swarm_hive_build_arm.json",
      teleporter: "/pa/units/structure/bug_teleporter/bug_teleporter.json",
      tempest: "/pa/units/land/bug_aa_big/bug_aa_big.json",
      tempestWeapon: "/pa/units/land/bug_aa_big/bug_aa_big_weapon.json",
      torpedoLauncher: "/pa/units/structure/bug_basic_torp/bug_basic_torp.json",
      torpedoLauncherAdvanced:
        "/pa/units/structure/bug_advanced_torp/bug_advanced_torp.json",
      umbrella: "/pa/units/structure/bug_anti_orbital/bug_anti_orbital.json",
      urchin: "/pa/units/structure/bug_wall/bug_wall.json",
      urchinMeleeAmmo: "/pa/units/structure/bug_wall/bug_wall_melee_ammo.json",
      urchinMeleeWeapon:
        "/pa/units/structure/bug_wall/bug_wall_melee_weapon.json",
      warriorGrunt: "/pa/units/land/bug_grunt_big/bug_grunt_big.json",
      warriorGruntAmmo: "/pa/units/land/bug_grunt/bug_grunt_ammo.json",
      warriorGruntBugGruntWeapon:
        "/pa/units/land/bug_grunt_big/bug_grunt_weapon.json",
      warriorGruntResearch:
        "/pa/units/research/unlocks/bug_grunt_big_unlock/research_grunt.json",
      warriorGruntUnlock:
        "/pa/units/research/unlocks/bug_grunt_big_unlock/bug_grunt_big_unlock.json",
      zapper: "/pa/units/land/bug_aa/bug_aa.json",
      zapperWeapon: "/pa/units/land/bug_aa/bug_aa_weapon.json",
      zeus: "/pa/units/air/bug_air_titan/bug_air_titan.json",
    },
    unitNames: {
      acidTurret: "!LOC:Acid Turret",
      airHiveAdvanced: "!LOC:Advanced Air Hive",
      alphaBoomer: "!LOC:Alpha Boomer",
      anchor: "Bug Anchor",
      antiNukeLauncher: "!LOC:Bug Anti-Nuke Launcher",
      arkyd: "ARKYD",
      assaultRipper: "Assault Ripper",
      astraeus: "Astraeus",
      baseAdvUnlock: "!LOC:Base adv research",
      baseCommander: "Base Commander",
      baseUnitUnlock: "!LOC:base unit unlock",
      baseUnlock: "!LOC:Base research",
      basicAirHive: "!LOC:Basic Air Hive",
      basicHive: "!LOC:Basic Hive",
      basilisk: "!LOC:Basilisk",
      behemoth: "!LOC:Behemoth",
      belcher: "!LOC:Belcher",
      bigBoomerEgg: "!LOC:Big Boomer Egg",
      bombardier: "!LOC:Bombardier",
      boomer: "!LOC:Boomer",
      boomerEgg: "!LOC:Boomer Egg",
      boomerMineResearch: "!LOC:Bug Boomer Mine Unlock",
      boomerMineUnlock: "!LOC:Bug Boomer Mine Unlock",
      boomerbugBoomer: "Boomer",
      cataclysm: "Cataclysm",
      catalyst: "Catalyst",
      chargingPortal: "!LOC:Charging Portal",
      cheapCombatFabResearch: "!LOC:Cheap Combat Fab Unlock",
      cheapCombatFabUnlock: "!LOC:Cheap Combat Fab Unlock",
      chomper: "Chomper",
      chomperResearch: "!LOC:Bug Chomper Unlock",
      chomperUnlock: "!LOC:Bug Chomper Unlock",
      corvus: "Corvus",
      crusher: "!LOC:Crusher",
      crusherResearch: "!LOC:Crusher Unlock",
      crusherUnlock: "!LOC:Crusher Unlock",
      energyPlant: "!LOC:Bug Energy Plant",
      energyPlantAdvanced: "!LOC:Advanced Energy Plant",
      fab: "!LOC:Bug Fab",
      fabAircraftAdvanced: "!LOC:Advanced Fab Aircraft",
      fabricationAircraft: "!LOC:Fabrication Aircraft",
      fabricationBotAdvanced: "!LOC:Advanced Fabrication Bot",
      fabricationShip: "!LOC:Bug Fabrication Ship",
      fabricationShipAdvanced: "!LOC:Advanced Fabrication Ship",
      fastNeedlerResearch: "!LOC:Fast Needler Unlock",
      fastNeedlerUnlock: "!LOC:Fast Needler Unlock",
      fighter: "!LOC:Bug Fighter",
      firefly: "Firefly",
      forager: "!LOC:Forager",
      foragerbugCombatFab: "Forager",
      gasHive: "!LOC:Gas Hive",
      grunt: "!LOC:Grunt",
      halley: "!LOC:Halley",
      harpy: "!LOC:Harpy",
      heavyAATurret: "!LOC:Bug Heavy AA Turret",
      hiveAdvanced: "!LOC:Advanced Hive",
      holkins: "!LOC:Bug Holkins",
      hydra: "!LOC:Hydra",
      hydraResearch: "!LOC:Hydra Unlock",
      hydraUnlock: "!LOC:Hydra Unlock",
      jig: "Jig",
      landedBugOrbitalFabricator: "Landed Bug Orbital Fabricator",
      largeSpitterTurret: "!LOC:Large Spitter Turret",
      laserPlatform: "!LOC:Bug Laser Platform",
      lightAATurret: "!LOC:Bug Light AA Turret",
      lilu: "Lilu",
      liluNest: "Lilu Nest",
      manticore: "!LOC:Manticore",
      matriarch: "!LOC:Matriarch",
      medusa: "!LOC:Medusa",
      metalExtractor: "!LOC:Bug Metal Extractor",
      metalExtractorAdvanced: "!LOC:Bug Advanced Metal Extractor",
      navalFactory: "!LOC:Naval Factory",
      navalFactoryAdvanced: "!LOC:Advanced Naval Factory",
      needleTurret: "!LOC:Needle Turret",
      needler: "!LOC:Needler",
      needlerbugNeedler: "Needler",
      nug: "!LOC:Nug",
      orbitalCarrierResearch: "!LOC:Bug Orbital Carrier Unlock",
      orbitalCarrierUnlock: "!LOC:Bug Orbital Carrier Unlock",
      orbitalFab: "Bug Orbital Fab",
      orbitalFighterVisionResearch: "!LOC:Bug Orbital Fighter Vision Unlock",
      orbitalFighterVisionUnlock: "!LOC:Bug Orbital Fighter Vision Unlock",
      orbitalLaserResearch: "!LOC:Bug Orbital Laser Unlock",
      orbitalLaserUnlock: "!LOC:Bug Orbital Laser Unlock",
      orbitalMine: "Bug Orbital Mine",
      orbitalRadarUnlockAdvancedResearch: "!LOC:Advanced Orbital Radar Unlock",
      orbitalRadarUnlockAdvancedUnlock: "!LOC:Advanced Orbital Radar Unlock",
      pariahControlNode: "!LOC:Pariah Control Node",
      pelter: "!LOC:Bug Pelter",
      phoenix: "!LOC:Bug Phoenix",
      pike: "Pike",
      portalRing: "!LOC:Portal Ring",
      radar: "!LOC:Bug Radar",
      radarAdvanced: "!LOC:Bug Advanced Radar",
      radarSatelliteAdvanced: "!LOC:Advanced Radar Satellite",
      rak: "!LOC:Rak",
      ripper: "!LOC:Ripper",
      runner: "!LOC:Runner",
      scorcher: "!LOC:Scorcher",
      scourgeToxinLauncher: "!LOC:Scourge Toxin Launcher",
      seeker: "Seeker",
      seekerbugOrbitalFighter: "Seeker",
      smallSpitterTurret: "!LOC:Small Spitter Turret",
      sniper: "!LOC:Bug Sniper",
      spire: "!LOC:Spire",
      stealthRipper: "!LOC:Stealth Ripper",
      stealthRipperResearch: "!LOC:Stealth Ripper Unlock",
      stealthRipperUnlock: "!LOC:Stealth Ripper Unlock",
      stealthTurret: "!LOC:Stealth Turret",
      stheno: "!LOC:Stheno",
      storage: "!LOC:Bug Storage",
      swarmHive: "!LOC:Swarm Hive",
      teleporter: "!LOC:Bug Teleporter",
      tempest: "!LOC:Tempest",
      torpedoLauncher: "!LOC:Bug Torpedo Launcher",
      torpedoLauncherAdvanced: "!LOC:Bug Advanced Torpedo Launcher",
      umbrella: "!LOC:Bug Umbrella",
      urchin: "!LOC:Urchin",
      warriorGrunt: "!LOC:Warrior Grunt",
      warriorGruntResearch: "!LOC:Warrior Grunt Unlock",
      warriorGruntUnlock: "!LOC:Warrior Grunt Unlock",
      zapper: "!LOC:Zapper",
      zeus: "!LOC:Zeus",
    },
  };
});
