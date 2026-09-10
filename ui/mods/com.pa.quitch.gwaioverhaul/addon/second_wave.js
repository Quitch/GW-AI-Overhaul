// Second Wave as a Galactic War add-on: units for MLA, Legion and Bugs, and
// AI data for the first two. `units` keys every spec the mod adds by a name
// of its own (the same shape as shared/units.js) and `unitNames` carries the
// display names by the same keys. What a player fields follows from
// capability cells. See races.md, "Add-ons".
define(function () {
  return {
    id: "second_wave",
    name: "!LOC:Second Wave",
    serverMods: ["pa.mla.unit.addon"],
    layers: {
      // mla/ sub-directories under two build directories, a unit map, and an
      // aux map of builder aliases both layers' build files read.
      mla: {
        titans: {
          unitMaps: [
            "/pa/ai/unit_maps/second_wave.json",
            "/pa/ai/unit_maps/second_wave_aux.json",
          ],
          sources: [
            { dir: "/pa/ai/fabber_builds/", match: "mla/" },
            { dir: "/pa/ai/factory_builds/", match: "mla/" },
          ],
        },
      },
      legion: {
        titans: {
          unitMaps: [
            "/pa/ai/unit_maps/second_wave_legion.json",
            "/pa/ai/unit_maps/second_wave_aux.json",
          ],
          sources: [
            { dir: "/pa/ai/fabber_builds/", match: "legion/" },
            { dir: "/pa/ai/factory_builds/", match: "legion/" },
          ],
        },
      },
    },
    units: {
      advancedEnergyStorage:
        "/pa/units/addon/adv_energy_storage/adv_energy_storage.json",
      advancedFabricationTower:
        "/pa/units/addon/adv_fab_tower/adv_fab_tower.json",
      advancedFabricationTowerBuildArm:
        "/pa/units/addon/adv_fab_tower/adv_fab_tower_build_arm.json",
      advancedFabricationTowerBugs:
        "/pa/units/b_addon/adv_fab_tower/adv_fab_tower.json",
      advancedFabricationTowerBugsBuildArm:
        "/pa/units/addon/adv_fab_tower/adv_fab_tower_build_arm.json",
      advancedFabricationTurret:
        "/pa/units/l_addon/adv_fab_turret/adv_fab_turret.json",
      advancedFabricationTurretBuildArm:
        "/pa/units/l_addon/adv_fab_turret/adv_fab_turret_build_arm.json",
      advancedMassGenerator:
        "/pa/units/l_addon/adv_mass_generator/adv_mass_generator.json",
      advancedMassGeneratorDeathRangeWeapon:
        "/pa/units/addon/adv_metal_generator/death_range.json",
      advancedMassGeneratorAmmo:
        "/pa/units/land/assault_bot/assault_bot_ammo.json",
      advancedMassGeneratorBoomDeathAmmo:
        "/pa/units/addon/adv_metal_generator/adv_metal_generator_boom_ammo.json",
      advancedMetalGenerator:
        "/pa/units/addon/adv_metal_generator/adv_metal_generator.json",
      advancedMetalGeneratorDeathRangeWeapon:
        "/pa/units/addon/adv_metal_generator/death_range.json",
      advancedMetalGeneratorAmmo:
        "/pa/units/land/assault_bot/assault_bot_ammo.json",
      advancedMetalGeneratorBoomDeathAmmo:
        "/pa/units/addon/adv_metal_generator/adv_metal_generator_boom_ammo.json",
      advancedMetalGeneratorBugs:
        "/pa/units/b_addon/adv_metal_generator/adv_metal_generator.json",
      advancedMetalGeneratorBugsDeathRangeWeapon:
        "/pa/units/addon/adv_metal_generator/death_range.json",
      advancedMetalGeneratorBugsAmmo:
        "/pa/units/land/assault_bot/assault_bot_ammo.json",
      advancedMetalGeneratorBugsBoomDeathAmmo:
        "/pa/units/addon/adv_metal_generator/adv_metal_generator_boom_ammo.json",
      advancedMetalStorage:
        "/pa/units/addon/adv_metal_storage/adv_metal_storage.json",
      almaz: "/pa/units/l_addon/anti_ground_satellite/almaz.json",
      almazWeapon: "/pa/units/l_addon/anti_ground_satellite/almaz_tool.json",
      almazAmmo: "/pa/units/l_addon/anti_ground_satellite/almaz_ammo.json",
      andreasLaserPlatform: "/pa/units/addon/andreas/andreas.json",
      andreasLaserPlatformWeapon: "/pa/units/addon/andreas/andreas_tool.json",
      andreasLaserPlatformAmmo: "/pa/units/addon/andreas/andreas_ammo.json",
      antiMissileTower:
        "/pa/units/addon/anti_missile_tower/anti_missile_tower.json",
      antiMissileTowerWeapon:
        "/pa/units/addon/anti_missile_tower/anti_missile_tower_tool.json",
      antiMissileTowerAmmo:
        "/pa/units/addon/anti_missile_tower/anti_missile_tower_ammo.json",
      antiMissileTowerTool2Weapon:
        "/pa/units/addon/anti_missile_tower/anti_missile_tower_tool_2.json",
      antiMissileTowerAmmo2Ammo:
        "/pa/units/addon/anti_missile_tower/anti_missile_tower_ammo_2.json",
      beowulf: "/pa/units/l_addon/l_demi_titan_bot/l_demi_titan_bot.json",
      beowulfWeapon:
        "/pa/units/l_addon/l_demi_titan_bot/l_demi_titan_bot_weapon.json",
      beowulfAmmo:
        "/pa/units/l_addon/l_demi_titan_bot/l_demi_titan_bot_ammo.json",
      beowulfAmmoDeathAmmo:
        "/pa/units/l_addon/l_demi_titan_bot/l_demi_titan_bot_ammo_death.json",
      centaur: "/pa/units/addon/adv_heavy_bot/adv_heavy_bot.json",
      centaurWeapon: "/pa/units/addon/adv_heavy_bot/adv_heavy_bot_weapon.json",
      centaurAmmo: "/pa/units/addon/adv_heavy_bot/adv_heavy_bot_ammo.json",
      fabricationSub: "/pa/units/addon/fabrication_sub/fabrication_sub.json",
      fabricationSubBuildArm:
        "/pa/units/addon/fabrication_sub/fabrication_sub_build_arm.json",
      fabricationTower: "/pa/units/addon/fab_tower/fab_tower.json",
      fabricationTowerBuildArm:
        "/pa/units/addon/fab_tower/fab_tower_build_arm.json",
      fabricationTowerBugs: "/pa/units/b_addon/fab_tower/fab_tower.json",
      fabricationTowerBugsBuildArm:
        "/pa/units/addon/fab_tower/fab_tower_build_arm.json",
      fabricationTurret: "/pa/units/l_addon/fab_turret/fab_turret.json",
      fabricationTurretBuildArm:
        "/pa/units/l_addon/fab_turret/fab_turret_build_arm.json",
      gigasiloStorageDevice:
        "/pa/units/l_addon/l_adv_storage/l_adv_storage.json",
      gigasiloStorageDeviceDeathAmmo:
        "/pa/units/land/l_adv_storage/l_adv_storage_death_weapon.json",
      juno: "/pa/units/addon/demi_titan_bot/demi_titan_bot.json",
      junoWeapon: "/pa/units/addon/demi_titan_bot/demi_titan_bot_weapon.json",
      junoAmmo: "/pa/units/addon/demi_titan_bot/demi_titan_bot_ammo.json",
      junoAmmoDeathAmmo:
        "/pa/units/addon/demi_titan_bot/demi_titan_bot_ammo_death.json",
      kampela:
        "/pa/units/addon/naval_anti_orbital_ship/naval_anti_orbital.json",
      kampelaWeapon:
        "/pa/units/addon/naval_anti_orbital_ship/naval_anti_orbital_weapon.json",
      kampelaAmmo:
        "/pa/units/addon/naval_anti_orbital_ship/naval_anti_orbital_ammo.json",
      kampelaAntidropWeapon:
        "/pa/units/addon/naval_anti_orbital_ship/naval_anti_orbital_antidrop.json",
      kampelaAntidropAmmo:
        "/pa/units/addon/naval_anti_orbital_ship/naval_anti_orbital_antidrop_ammo.json",
      lynx: "/pa/units/l_addon/anti_orbital_armor/lynx.json",
      lynxWeapon: "/pa/units/l_addon/anti_orbital_armor/lynx_weapon.json",
      lynxAmmo: "/pa/units/l_addon/anti_orbital_armor/lynx_ammo.json",
      lynxToolAntidropWeapon:
        "/pa/units/l_addon/anti_orbital_armor/lynx_tool_antidrop.json",
      lynxAntidropAmmo:
        "/pa/units/l_addon/anti_orbital_armor/lynx_antidrop_ammo.json",
      malacos: "/pa/units/l_addon/anti_orbital_ship/anti_orbital_ship.json",
      malacosWeapon:
        "/pa/units/l_addon/anti_orbital_ship/anti_orbital_ship_weapon.json",
      malacosAmmo:
        "/pa/units/l_addon/anti_orbital_ship/anti_orbital_ship_ammo.json",
      malacosAntidropWeapon:
        "/pa/units/l_addon/anti_orbital_ship/anti_orbital_ship_antidrop.json",
      malacosAntidropAmmo:
        "/pa/units/l_addon/anti_orbital_ship/anti_orbital_ship_antidrop_ammo.json",
      massGenerator: "/pa/units/l_addon/mass_generator/mass_generator.json",
      massGeneratorDeathRangeWeapon:
        "/pa/units/addon/metal_generator/death_range.json",
      massGeneratorAmmo: "/pa/units/land/assault_bot/assault_bot_ammo.json",
      massGeneratorBoomDeathAmmo:
        "/pa/units/addon/metal_generator/metal_generator_boom_ammo.json",
      metalGenerator: "/pa/units/addon/metal_generator/metal_generator.json",
      metalGeneratorDeathRangeWeapon:
        "/pa/units/addon/metal_generator/death_range.json",
      metalGeneratorAmmo: "/pa/units/land/assault_bot/assault_bot_ammo.json",
      metalGeneratorBoomDeathAmmo:
        "/pa/units/addon/metal_generator/metal_generator_boom_ammo.json",
      metalGeneratorBugs:
        "/pa/units/b_addon/metal_generator/metal_generator.json",
      metalGeneratorBugsDeathRangeWeapon:
        "/pa/units/addon/metal_generator/death_range.json",
      metalGeneratorBugsAmmo:
        "/pa/units/land/assault_bot/assault_bot_ammo.json",
      metalGeneratorBugsBoomDeathAmmo:
        "/pa/units/addon/metal_generator/metal_generator_boom_ammo.json",
      orbitalAntiNukeCannon:
        "/pa/units/l_addon/orbital_anti_nuke/orbital_anti_nuke.json",
      orbitalAntiNukeCannonWeaponLandWeapon:
        "/pa/units/l_addon/orbital_anti_nuke/orbital_anti_nuke_weapon_land.json",
      orbitalAntiNukeCannonAmmoLandAmmo:
        "/pa/units/l_addon/orbital_anti_nuke/orbital_anti_nuke_ammo_land.json",
      orbitalAntiNukeCannonWeapon:
        "/pa/units/l_addon/orbital_anti_nuke/orbital_anti_nuke_weapon.json",
      orbitalAntiNukeCannonAmmo:
        "/pa/units/addon/orbital_anti_nuke/orbital_anti_nuke_ammo.json",
      orbitalAntiNukePlatform:
        "/pa/units/addon/orbital_anti_nuke/orbital_anti_nuke.json",
      orbitalAntiNukePlatformWeaponOrbitalWeapon:
        "/pa/units/addon/orbital_anti_nuke/orbital_anti_nuke_weapon_orbital.json",
      orbitalAntiNukePlatformAmmoOrbitalAmmo:
        "/pa/units/addon/orbital_anti_nuke/orbital_anti_nuke_ammo_orbital.json",
      orbitalAntiNukePlatformWeapon:
        "/pa/units/addon/orbital_anti_nuke/orbital_anti_nuke_weapon.json",
      orbitalAntiNukePlatformAmmo:
        "/pa/units/addon/orbital_anti_nuke/orbital_anti_nuke_ammo.json",
      orbitalPowerCatalyst:
        "/pa/units/l_addon/l_orbital_power/l_orbital_power.json",
      pegasus:
        "/pa/units/addon/adv_stealth_transport/adv_stealth_transport.json",
      phalanx:
        "/pa/units/l_addon/basic_missile_defence/basic_missile_defence.json",
      phalanxWeapon:
        "/pa/units/l_addon/basic_missile_defence/basic_missile_defence_weapon.json",
      phalanxAmmo:
        "/pa/units/l_addon/basic_missile_defence/basic_missile_defence_ammo.json",
      phalanxAntidropWeapon:
        "/pa/units/l_addon/basic_missile_defence/basic_missile_defence_antidrop.json",
      phalanxAntidropAmmo:
        "/pa/units/l_addon/basic_missile_defence/basic_missile_defence_antidrop_ammo.json",
      planetWideRadar: "/pa/units/addon/system_radar/system_radar.json",
      planetWideRadarBugs: "/pa/units/b_addon/system_radar/system_radar.json",
      planetWideRadarLegion: "/pa/units/l_addon/system_radar/system_radar.json",
      pounder: "/pa/units/addon/pounder/pounder.json",
      pounderWeapon: "/pa/units/addon/pounder/pounder_weapon.json",
      pounderAmmo: "/pa/units/addon/pounder/pounder_ammo.json",
      radarJammingInstallation:
        "/pa/units/addon/jammer_titan/jammer_titan.json",
      rex: "/pa/units/addon/rex/rex.json",
      rexWeapon: "/pa/units/addon/rex/rex_tool_weapon.json",
      rexAmmo: "/pa/units/addon/rex/rex_ammo.json",
      rexToolAntidropWeapon: "/pa/units/addon/rex/rex_tool_antidrop.json",
      rexAntidropAmmo: "/pa/units/addon/rex/rex_antidrop_ammo.json",
      saxon: "/pa/units/addon/adv_tank_hover/adv_tank_hover.json",
      saxonWeapon:
        "/pa/units/addon/adv_tank_hover/adv_tank_hover_tool_weapon.json",
      saxonAmmo: "/pa/units/addon/adv_tank_hover/adv_tank_hover_ammo.json",
      shadeStealthPlatform:
        "/pa/units/l_addon/l_orbital_jammer/l_orbital_jammer.json",
      shieldGenerator: "/pa/units/addon/shield_gen/shield_gen.json",
      spear: "/pa/units/addon/basic_missile_defence/basic_missile_defence.json",
      spearWeapon:
        "/pa/units/addon/basic_missile_defence/basic_missile_defence_weapon.json",
      spearAmmo:
        "/pa/units/addon/basic_missile_defence/basic_missile_defence_ammo.json",
      spearAntidropWeapon:
        "/pa/units/addon/basic_missile_defence/basic_missile_defence_antidrop.json",
      spearAntidropAmmo:
        "/pa/units/addon/basic_missile_defence/basic_missile_defence_antidrop_ammo.json",
      spearBugs:
        "/pa/units/b_addon/basic_missile_defence/basic_missile_defence.json",
      spearBugsWeapon:
        "/pa/units/addon/basic_missile_defence/basic_missile_defence_weapon.json",
      spearBugsAmmo:
        "/pa/units/addon/basic_missile_defence/basic_missile_defence_ammo.json",
      spearBugsAntidropWeapon:
        "/pa/units/addon/basic_missile_defence/basic_missile_defence_antidrop.json",
      spearBugsAntidropAmmo:
        "/pa/units/addon/basic_missile_defence/basic_missile_defence_antidrop_ammo.json",
      stalker: "/pa/units/addon/stalker/stalker.json",
      stalkerWeapon: "/pa/units/addon/stalker/stalker_weapon.json",
      stalkerAmmo: "/pa/units/addon/stalker/stalker_ammo.json",
      stealthGeneratorStation:
        "/pa/units/l_addon/l_jammer_station/l_jammer_station.json",
      swordfish: "/pa/units/addon/swordfish/swordfish.json",
      swordfishWeapon: "/pa/units/addon/swordfish/swordfish_weapon.json",
      swordfishAmmo: "/pa/units/addon/swordfish/swordfish_ammo.json",
      swordfishTorpedoWeapon:
        "/pa/units/addon/swordfish/swordfish_torpedo.json",
      swordfishAmmoTorpedoAmmo:
        "/pa/units/addon/swordfish/swordfish_ammo_torpedo.json",
      swordfishToolBoomWeapon:
        "/pa/units/addon/swordfish/swordfish_tool_boom.json",
      swordfishBombAmmo: "/pa/units/addon/swordfish/swordfish_bomb_ammo.json",
    },
    unitNames: {
      advancedEnergyStorage: "!LOC:Advanced Energy Storage",
      advancedFabricationTower: "!LOC:Advanced Fabrication Tower",
      advancedFabricationTowerBugs: "!LOC:Advanced Fabrication Tower",
      advancedFabricationTurret: "!LOC:Advanced Fabrication Turret",
      advancedMassGenerator: "!LOC:Advanced Mass Generator",
      advancedMetalGenerator: "!LOC:Advanced Metal Generator",
      advancedMetalGeneratorBugs: "!LOC:Advanced Metal Generator",
      advancedMetalStorage: "!LOC:Advanced Metal Storage",
      almaz: "!LOC:Almaz",
      andreasLaserPlatform: "!LOC:Andreas Laser Platform",
      antiMissileTower: "!LOC:Anti-Missile Tower",
      beowulf: "!LOC:Beowulf",
      centaur: "!LOC:Centaur",
      fabricationSub: "!LOC:Fabrication Sub",
      fabricationTower: "!LOC:Fabrication Tower",
      fabricationTowerBugs: "!LOC:Fabrication Tower",
      fabricationTurret: "!LOC:Fabrication Turret",
      gigasiloStorageDevice: "!LOC:GigaSilo Storage Device",
      juno: "!LOC:Juno",
      kampela: "!LOC:Kampela",
      lynx: "!LOC:Lynx",
      malacos: "!LOC:Malacos",
      massGenerator: "!LOC:Mass Generator",
      metalGenerator: "!LOC:Metal Generator",
      metalGeneratorBugs: "!LOC:Metal Generator",
      orbitalAntiNukeCannon: "!LOC:Orbital Anti-Nuke Cannon",
      orbitalAntiNukePlatform: "!LOC:Orbital Anti-Nuke Platform",
      orbitalPowerCatalyst: "!LOC:Orbital Power Catalyst",
      pegasus: "!LOC:Pegasus",
      phalanx: "!LOC:Phalanx",
      planetWideRadar: "!LOC:Planet-wide Radar",
      planetWideRadarBugs: "!LOC:Planet-wide Radar",
      planetWideRadarLegion: "!LOC:Planet-wide Radar",
      pounder: "!LOC:Pounder",
      radarJammingInstallation: "!LOC:Radar Jamming Installation",
      rex: "!LOC:Rex",
      saxon: "!LOC:Saxon",
      shadeStealthPlatform: "!LOC:Shade Stealth Platform",
      shieldGenerator: "!LOC:Shield Generator",
      spear: "!LOC:Spear",
      spearBugs: "!LOC:Spear",
      stalker: "!LOC:Stalker",
      stealthGeneratorStation: "!LOC:Stealth Generator Station",
      swordfish: "!LOC:Swordfish",
    },
  };
});
