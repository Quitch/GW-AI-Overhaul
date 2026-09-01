// The Exiles as a Galactic War race. Commanders and AI data are what the mod
// ships. `units` names every Exiles spec by an Exiles key (the same shape as
// shared/units.js, so Exiles-only cards can address them) and `unitNames`
// carries the display names by Exiles key. What an Exiles player fields for
// the vanilla units held follows from capability cells. See races.md and
// race-conventions.md.
define(function () {
  return {
    id: "exiles",
    name: "!LOC:Exiles",
    serverMods: ["com.pa.nik.exiles"],
    unitTypeBit: "Custom6",
    // The preview art ships in the blue team paint, a touch greener than
    // MLA's.
    commanderArtHue: 200,
    commanderTypes: {
      unitType: "UNITTYPE_Custom6",
      buildable: "CmdBuild & Custom6",
    },
    commanders: [
      { spec: "/pa/units/commanders/exiles_maxim/exiles_maxim.json" },
      { spec: "/pa/units/commanders/exiles_taurus/exiles_taurus.json" },
      { spec: "/pa/units/commanders/exiles_blueberry/exiles_blueberry.json" },
      { spec: "/pa/units/commanders/exiles_brainiac/exiles_brainiac.json" },
    ],
    // The server mod ships the pair itself, under its ui/mods folder.
    playerIcon: {
      fill: "coui://ui/mods/com.pa.nik.exiles/img/exiles_icon_fill.png",
      outline: "coui://ui/mods/com.pa.nik.exiles/img/exiles_icon_outline.png",
    },
    ai: {
      // exiles/ sub-directories under each build directory, one unit map.
      // The mod also ships platoon_templates.json and platoon_land_builds.json
      // at the vanilla paths; those ride into every race tree's base layer
      // with the merged content. See races.md.
      titans: {
        unitMaps: ["/pa/ai/unit_maps/exiles.json"],
        sources: [
          { dir: "/pa/ai/fabber_builds/", match: "exiles/" },
          { dir: "/pa/ai/factory_builds/", match: "exiles/" },
          { dir: "/pa/ai/platoon_builds/", match: "exiles/" },
          { dir: "/pa/ai/platoon_templates/", match: "exiles/" },
        ],
      },
    },
    units: {
      advFabricationBot: "/pa/units/land/t_bot_fab_adv/t_bot_fab_adv.json",
      advFabricationBotAdvBuildArm:
        "/pa/units/land/t_bot_fab_adv/adv_build_arm.json",
      aetherEngine: "/pa/units/exiles/mass_tele_titan/mass_tele_titan.json",
      airFactory: "/pa/units/air/t_air_fac/t_air_fac.json",
      airFactoryAdvanced: "/pa/units/air/t_air_fac_adv/t_air_fac_adv.json",
      ambushTurret: "/pa/units/land/ambush_twr/hid/ambush_twr_hid.json",
      ambushTurretAmmo:
        "/pa/units/land/ambush_twr/hid/ambush_twr_hid_ammo.json",
      ambushTurretDeployed: "/pa/units/land/ambush_twr/ambush_twr.json",
      ambushTurretDeployedAmmo:
        "/pa/units/land/ambush_twr/ambush_twr_ammo.json",
      ambushTurretDeployedRecoverAmmo:
        "/pa/units/land/ambush_twr/ambush_twr_recover_ammo.json",
      ambushTurretDeployedToolRecover:
        "/pa/units/land/ambush_twr/ambush_twr_tool_recover.json",
      ambushTurretDeployedWeapon:
        "/pa/units/land/ambush_twr/ambush_twr_tool_weapon.json",
      ambushTurretWeapon:
        "/pa/units/land/ambush_twr/hid/ambush_twr_hid_tool_weapon.json",
      antiBallistics: "/pa/units/land/anti_ballistics/anti_ballistics.json",
      antiBallisticsAmmo:
        "/pa/units/land/anti_ballistics/anti_ballistics_ammo.json",
      antiBallisticsWeapon:
        "/pa/units/land/anti_ballistics/anti_ballistics_tool_weapon.json",
      antiNukeLauncher:
        "/pa/units/land/t_anti_nuke_launcher/t_anti_nuke_launcher.json",
      antiNukeLauncherWeapon:
        "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher_tool_weapon.json",
      atropa: "/pa/units/land/aa_missile_launcher/aa_missile_launcher.json",
      atropaAirDefenseComplexAdvAmmo:
        "/pa/units/land/aa_missile_launcher/air_defense_complex_adv_ammo.json",
      atropaAirDefenseComplexAdvBuildArm:
        "/pa/units/land/aa_missile_launcher/air_defense_complex_adv_build_arm.json",
      atropaAirDefenseComplexAdvWeapon:
        "/pa/units/land/aa_missile_launcher/air_defense_complex_adv_tool_weapon.json",
      auroraTurret: "/pa/units/land/t_aa_twr_adv/t_aa_twr_adv.json",
      auroraTurretAmmo: "/pa/units/land/t_aa_twr_adv/t_aa_twr_adv_ammo.json",
      auroraTurretWeapon:
        "/pa/units/land/t_aa_twr_adv/t_aa_twr_adv_weapon.json",
      basicMetalExtractor:
        "/pa/units/land/t_metal_extractor_0/t_metal_extractor_0.json",
      basicMetalExtractorAmmo:
        "/pa/units/land/t_metal_extractor_0/t_metal_extractor_0_ammo.json",
      basicMetalExtractorWeapon:
        "/pa/units/land/t_metal_extractor_0/t_metal_extractor_0_weapon.json",
      blueberryCommander:
        "/pa/units/commanders/exiles_blueberry/exiles_blueberry.json",
      blueberryCommanderAmmo:
        "/pa/units/commanders/exiles_blueberry/exiles_blueberry_ammo.json",
      blueberryCommanderAmmoUber:
        "/pa/units/commanders/exiles_blueberry/exiles_blueberry_ammo_uber.json",
      blueberryCommanderBuildArm:
        "/pa/units/commanders/exiles_blueberry/exiles_blueberry_build_arm.json",
      blueberryCommanderToolAaWeapon:
        "/pa/units/commanders/exiles_blueberry/exiles_blueberry_tool_aa_weapon.json",
      blueberryCommanderToolTorpedoWeapon:
        "/pa/units/commanders/exiles_blueberry/exiles_blueberry_tool_torpedo_weapon.json",
      blueberryCommanderUberCannon:
        "/pa/units/commanders/exiles_blueberry/exiles_blueberry_uber_cannon.json",
      blueberryCommanderWeapon:
        "/pa/units/commanders/exiles_blueberry/exiles_blueberry_tool_weapon.json",
      bolt: "/pa/units/land/lightning/lightning.json",
      boltAmmo: "/pa/units/land/lightning/lightning_ammo.json",
      boltWeapon: "/pa/units/land/lightning/lightning_tool_weapon.json",
      botFactory: "/pa/units/land/t_bot_fac/t_bot_fac.json",
      botFactoryAdvanced: "/pa/units/land/t_bot_fac_adv/t_bot_fac_adv.json",
      botFactoryAdvancedBuildArm:
        "/pa/units/land/t_bot_fac_adv/t_bot_fac_adv_build_arm.json",
      botFactoryBuildArm: "/pa/units/land/t_bot_fac/t_bot_fac_build_arm.json",
      brainiacCommander:
        "/pa/units/commanders/exiles_brainiac/exiles_brainiac.json",
      brainiacCommanderAmmo2:
        "/pa/units/commanders/exiles_brainiac/exiles_brainiac_ammo2.json",
      brainiacCommanderBuildArm:
        "/pa/units/commanders/exiles_brainiac/exiles_brainiac_build_arm.json",
      brainiacCommanderToolTracer:
        "/pa/units/commanders/exiles_brainiac/tool_tracer.json",
      brainiacCommanderTracerAmmo:
        "/pa/units/commanders/exiles_brainiac/tracer_ammo.json",
      brainiacCommanderWeapon:
        "/pa/units/commanders/exiles_brainiac/exiles_brainiac_tool_weapon.json",
      brick: "/pa/units/sea/a_mortar/a_mortar.json",
      brickAmmo: "/pa/units/sea/a_mortar/a_mortar_ammo.json",
      brickWeapon: "/pa/units/sea/a_mortar/a_mortar_tool_weapon.json",
      cape: "/pa/units/land/gale/gale.json",
      capeAmmoDeploy: "/pa/units/land/gale/ammo_deploy.json",
      capeToolDeploy: "/pa/units/land/gale/tool_deploy.json",
      catalyst: "/pa/units/addon/t_control_module/t_control_module.json",
      chimera: "/pa/units/land/t_chimera/t_chimera.json",
      chimeraAmmo: "/pa/units/land/t_chimera/t_chimera_ammo.json",
      chimeraWeapon: "/pa/units/land/t_chimera/t_chimera_weapon.json",
      chirp: "/pa/units/sea/drone_aa/chirp/chirp.json",
      chirpLAirBombAirDeath:
        "/pa/units/sea/drone_aa/chirp/l_air_bomb_air_death.json",
      chirpLAirBombAmmo: "/pa/units/sea/drone_aa/chirp/l_air_bomb_ammo.json",
      chirpLAirBombDeathAmmo:
        "/pa/units/sea/drone_aa/chirp/l_air_bomb_death_ammo.json",
      chirpLAirBombDeathWeapon:
        "/pa/units/sea/drone_aa/chirp/l_air_bomb_death_tool_weapon.json",
      chirpLAirBombTracerAmmo:
        "/pa/units/sea/drone_aa/chirp/l_air_bomb_tracer_ammo.json",
      chirpLAirBombTracerWeapon:
        "/pa/units/sea/drone_aa/chirp/l_air_bomb_tracer_tool_weapon.json",
      chirpLAirBombWeapon:
        "/pa/units/sea/drone_aa/chirp/l_air_bomb_tool_weapon.json",
      cobra: "/pa/units/land/stalker/stalker.json",
      cobraAmmo: "/pa/units/land/stalker/stalker_ammo.json",
      cobraWeapon: "/pa/units/land/stalker/stalker_weapon.json",
      cougar: "/pa/units/land/tank_gattling/tank_gattling.json",
      cougarAmmo: "/pa/units/land/tank_gattling/tank_gattling_ammo.json",
      cougarWeapon:
        "/pa/units/land/tank_gattling/tank_gattling_tool_weapon.json",
      crocodile: "/pa/units/land/roamer/roamer.json",
      crocodileAmmo: "/pa/units/land/roamer/roamer_ammo.json",
      crocodileWeapon: "/pa/units/land/roamer/roamer_tool_weapon.json",
      cub: "/pa/units/land/can/can.json",
      cubAmmo: "/pa/units/land/can/can_ammo.json",
      cubWeapon: "/pa/units/land/can/can_tool_weapon.json",
      cyclone: "/pa/units/land/cyclone/cyclone.json",
      cycloneAmmo: "/pa/units/land/cyclone/cyclone_ammo.json",
      cycloneWeapon: "/pa/units/land/cyclone/cyclone_tool_weapon.json",
      cyclops: "/pa/units/land/tripod/tripod.json",
      cyclopsAmmo: "/pa/units/land/tripod/tripod_ammo.json",
      cyclopsWeapon: "/pa/units/land/tripod/tripod_tool_weapon.json",
      dragonfly: "/pa/units/air/scout/dragonfly.json",
      eagleOwl: "/pa/units/air/strat_bomber/strat_bomber.json",
      eagleOwlAmmo: "/pa/units/air/strat_bomber/strat_bomber_ammo.json",
      eagleOwlWeapon:
        "/pa/units/air/strat_bomber/strat_bomber_tool_weapon.json",
      energyPylon: "/pa/units/land/pylon/pylon.json",
      energyPylonOvercharge: "/pa/units/land/pylon/overcharge.json",
      energyPylonOverchargeAmmo: "/pa/units/land/pylon/overcharge_ammo.json",
      energyStorage: "/pa/units/land/t_power_storage/t_power_storage.json",
      experimentalMetalStorage: "/pa/units/land/t_storage/t_storage.json",
      experimentalMetalStorageDeathWeapon:
        "/pa/units/land/t_storage/t_storage_death_weapon.json",
      fabricationAircraft: "/pa/units/air/t_air_fab/t_air_fab.json",
      fabricationAircraftBuildArm:
        "/pa/units/air/t_air_fab/t_air_fab_build_arm.json",
      fabricationComplex:
        "/pa/units/structures/fab_complex/adv_fab_turret.json",
      fabricationComplexBuildArm:
        "/pa/units/structures/fab_complex/adv_fab_turret_build_arm.json",
      fabricationCrawler: "/pa/units/land/t_bot_fab/t_bot_fab.json",
      fabricationCrawlerBuildArm:
        "/pa/units/land/t_bot_fab/t_bot_fab_build_arm.json",
      fabricationFlyer: "/pa/units/air/t_air_fab_adv/t_air_fab_adv.json",
      fabricationFlyerBuildArm:
        "/pa/units/air/t_air_fab_adv/t_air_fab_adv_build_arm.json",
      fabricationShip: "/pa/units/sea/t_naval_fab/t_naval_fab.json",
      fabricationShipAdvanced:
        "/pa/units/sea/t_naval_fab_adv/t_naval_fab_adv.json",
      fabricationShipAdvancedBuildArm:
        "/pa/units/sea/t_naval_fab_adv/t_naval_fab_adv_build_arm.json",
      fabricationShipBuildArm:
        "/pa/units/sea/t_naval_fab/t_naval_fab_build_arm.json",
      fabricationVehicle: "/pa/units/land/t_tank_fab/t_tank_fab.json",
      fabricationVehicleBuildArm:
        "/pa/units/land/t_tank_fab/t_tank_fab_build_arm.json",
      fiend: "/pa/units/sea/a_croc/a_croc.json",
      fiendAmmo: "/pa/units/sea/a_croc/a_croc_ammo.json",
      fiendWeapon: "/pa/units/sea/a_croc/a_croc_tool_weapon.json",
      folga: "/pa/units/land/t_arta/t_arta.json",
      folgaAmmo: "/pa/units/land/t_arta/t_arta_ammo.json",
      folgaWeapon: "/pa/units/land/t_arta/t_arta_tool_weapon.json",
      gargoyle: "/pa/units/air/t_gunship/t_gunship.json",
      gargoyleAmmo: "/pa/units/air/t_gunship/t_gunship_ammo.json",
      gargoyleWeapon: "/pa/units/air/t_gunship/t_gunship_tool_weapon.json",
      hail: "/pa/units/land/hail/hail.json",
      hailAmmo: "/pa/units/land/hail/hail_ammo.json",
      hailWeapon: "/pa/units/land/hail/hail_tool_weapon.json",
      halley: "/pa/units/addon/t_delta_v_engine/t_delta_v_engine.json",
      hardtack: "/pa/units/sea/hardtack/hardtack.json",
      hardtackAmmo: "/pa/units/sea/hardtack/hardtack_ammo.json",
      hardtackAmmoIntercept:
        "/pa/units/sea/hardtack/hardtack_ammo_intercept.json",
      hardtackToolIntercept:
        "/pa/units/sea/hardtack/hardtack_tool_intercept.json",
      hardtackWeapon: "/pa/units/sea/hardtack/hardtack_tool_weapon.json",
      harperTurret: "/pa/units/land/t_aa_twr/t_aa_twr.json",
      harperTurretAmmo: "/pa/units/land/t_aa_twr/t_aa_twr_ammo.json",
      harperTurretWeapon: "/pa/units/land/t_aa_twr/t_aa_twr_weapon.json",
      hellnewBall: "/pa/units/land/tank_wheel/tank_wheel.json",
      hellnewBallAmmo: "/pa/units/land/tank_wheel/tank_wheel_ammo.json",
      hellnewBallWeapon: "/pa/units/land/tank_wheel/tank_wheel_weapon.json",
      heron: "/pa/units/air/t_transport_adv/t_transport_adv.json",
      hoverFabricator: "/pa/units/exiles/battle_fab/battle_fab.json",
      hoverFabricatorAdvanced:
        "/pa/units/exiles/battle_fab_adv/battle_fab_adv.json",
      hoverFabricatorAdvancedToolBuildArm:
        "/pa/units/exiles/battle_fab_adv/battle_fab_adv_tool_build_arm.json",
      hoverFabricatorToolBuildArm:
        "/pa/units/exiles/battle_fab/battle_fab_tool_build_arm.json",
      hyena: "/pa/units/land/hyena/hyena.json",
      hyenaFab: "/pa/units/land/hyena/fab_tool.json",
      hyperTideAssembly: "/pa/units/sea/t_naval_fac_adv/t_naval_fac_adv.json",
      hyperTideAssemblyBuildArm:
        "/pa/units/sea/t_naval_fac_adv/t_naval_fac_adv_build_arm.json",
      jaguar: "/pa/units/land/tank_heavy_adv/tank_heavy_adv.json",
      jaguarAmmo: "/pa/units/land/tank_heavy_adv/tank_heavy_adv_ammo.json",
      jaguarAmmoMissile:
        "/pa/units/land/tank_heavy_adv/tank_heavy_adv_ammo_missile.json",
      jaguarToolMissile:
        "/pa/units/land/tank_heavy_adv/tank_heavy_adv_tool_missile.json",
      jaguarWeapon:
        "/pa/units/land/tank_heavy_adv/tank_heavy_adv_tool_weapon.json",
      jelly: "/pa/units/land/jelly/jelly.json",
      jellyAmmo: "/pa/units/land/jelly/jelly_ammo.json",
      jellyWeapon: "/pa/units/land/jelly/jelly_tool_weapon.json",
      kikimora: "/pa/units/air/fighter_stealth/fighter_stealth.json",
      kikimoraAmmo: "/pa/units/air/fighter_stealth/fighter_stealth_ammo.json",
      kikimoraWeapon:
        "/pa/units/air/fighter_stealth/fighter_stealth_tool_weapon.json",
      lamya: "/pa/units/land/t_arta_long/t_arta_long.json",
      lamyaAirburstAmmo: "/pa/units/land/t_arta_long/airburst_ammo.json",
      lamyaBuildArm: "/pa/units/land/t_arta_long/t_arta_long_build_arm.json",
      lamyaWeapon: "/pa/units/land/t_arta_long/t_arta_long_tool_weapon.json",
      lanceDox: "/pa/units/land/sword_dox/sword_dox.json",
      lanceDoxAmmo: "/pa/units/land/sword_dox/sword_dox_ammo.json",
      lanceDoxWeapon: "/pa/units/land/sword_dox/sword_dox_tool_weapon.json",
      landMine: "/pa/units/land/hail/hail_mine/hail_mine.json",
      landMineAmmo: "/pa/units/land/hail/hail_mine/hail_mine_ammo.json",
      landMineAmmo2: "/pa/units/base/stun/stun_ammo.json",
      landMineDeathWeapon:
        "/pa/units/land/hail/hail_mine/hail_mine_death_weapon.json",
      landMineWeapon:
        "/pa/units/land/hail/hail_mine/hail_mine_tool_weapon.json",
      leviathan: "/pa/units/sea/t_battleship/t_battleship.json",
      lice: "/pa/units/land/lice/lice.json",
      maximCommander: "/pa/units/commanders/exiles_maxim/exiles_maxim.json",
      maximCommanderAmmo:
        "/pa/units/commanders/exiles_maxim/exiles_maxim_ammo.json",
      maximCommanderBuildArm:
        "/pa/units/commanders/exiles_maxim/exiles_maxim_build_arm.json",
      maximCommanderToolAaWeapon:
        "/pa/units/commanders/exiles_maxim/exiles_maxim_tool_aa_weapon.json",
      maximCommanderToolIntercept:
        "/pa/units/commanders/exiles_maxim/exiles_maxim_tool_intercept.json",
      maximCommanderUberCannon:
        "/pa/units/commanders/exiles_maxim/uber_cannon.json",
      maximCommanderUberShot:
        "/pa/units/commanders/exiles_maxim/uber_shot.json",
      maximCommanderWeapon:
        "/pa/units/commanders/exiles_maxim/exiles_maxim_tool_weapon.json",
      meerkat: "/pa/units/land/meerkat/meerkat.json",
      meerkatInterceptionAmmo:
        "/pa/units/land/meerkat/meerkat_interception_ammo.json",
      meerkatToolInterception:
        "/pa/units/land/meerkat/meerkat_tool_interception.json",
      metalExtractorAdvanced:
        "/pa/units/land/t_metal_extractor_2/t_metal_extractor_2.json",
      moray: "/pa/units/sea/cruiser/cruiser.json",
      morayAmmo: "/pa/units/sea/cruiser/cruiser_ammo.json",
      morayWeapon: "/pa/units/sea/cruiser/cruiser_tool_weapon.json",
      needletail: "/pa/units/air/t_int/t_int.json",
      needletailAmmo: "/pa/units/air/t_int/t_int_ammo.json",
      needletailWeapon: "/pa/units/air/t_int/t_int_tool_weapon.json",
      nukeMine: "/pa/units/land/gale/nuke_mine/nuke_mine.json",
      nukeMineAmmo: "/pa/units/land/gale/nuke_mine/nuke_mine_ammo.json",
      nukeMineWeapon:
        "/pa/units/land/gale/nuke_mine/nuke_mine_tool_weapon.json",
      ocelot: "/pa/units/land/t_tank_flak/t_tank_flak.json",
      ocelotAmmo: "/pa/units/land/t_tank_flak/t_tank_flak_ammo.json",
      ocelotWeapon: "/pa/units/land/t_tank_flak/t_tank_flak_tool_weapon.json",
      orbitalLauncher:
        "/pa/units/orbital/t_orbital_launcher/t_orbital_launcher.json",
      overchargedAdvancedReactor:
        "/pa/units/land/adv_pylon/overcharged/adv_pylon_overcharged.json",
      overchargedAdvancedReactorDeathWeapon:
        "/pa/units/land/adv_pylon/overcharged/death_weapon.json",
      overchargedAdvancedReactorSelfDestructWeapon:
        "/pa/units/land/adv_pylon/overcharged/self_destruct_weapon.json",
      overchargedEnergyPylon:
        "/pa/units/land/pylon/overcharged/pylon_overcharged.json",
      overchargedEnergyPylonSelfDestructAmmo:
        "/pa/units/land/pylon/overcharged/self_destruct_ammo.json",
      overchargedEnergyPylonSelfDestructWeapon:
        "/pa/units/land/pylon/overcharged/self_destruct_weapon.json",
      puma: "/pa/units/commanders/ft_commander/ft_commander.json",
      pumaAmmo: "/pa/units/commanders/ft_commander/ft_commander_ammo.json",
      pumaAmmoAlt:
        "/pa/units/commanders/ft_commander/ft_commander_ammo_alt.json",
      pumaBuildArm:
        "/pa/units/commanders/ft_commander/ft_commander_build_arm.json",
      pumaWeapon: "/pa/units/commanders/ft_commander/ft_commander_weapon.json",
      pumaWeaponAlt:
        "/pa/units/commanders/ft_commander/ft_commander_weapon_alt.json",
      quadTurret: "/pa/units/land/quad_turret/quad_turret.json",
      quadTurretAmmo: "/pa/units/land/quad_turret/quad_turret_ammo.json",
      quadTurretWeapon: "/pa/units/land/quad_turret/quad_turret_weapon.json",
      radar: "/pa/units/addon/r_radar/r_radar.json",
      reactor: "/pa/units/land/reactor/reactor.json",
      reactorAdvanced: "/pa/units/land/adv_pylon/adv_pylon.json",
      reactorAdvancedOvercharge: "/pa/units/land/adv_pylon/overcharge.json",
      reactorAdvancedOverchargeAmmo:
        "/pa/units/land/adv_pylon/overcharge_ammo.json",
      reactorAmmo: "/pa/units/base/regen_1/regen_1_ammo.json",
      reactorTool: "/pa/units/base/regen_1/regen_1_tool.json",
      reconAmmo: "/pa/units/base/recon/recon.json",
      redkite: "/pa/units/air/t_bomber/t_bomber.json",
      redkiteAmmo: "/pa/units/air/t_bomber/t_bomber_ammo.json",
      redkiteWeapon: "/pa/units/air/t_bomber/t_bomber_tool_weapon.json",
      rhino: "/pa/units/land/luddite/luddite.json",
      rhinoAmmo: "/pa/units/land/luddite/ammo.json",
      rhinoWeapon: "/pa/units/land/luddite/weapon.json",
      scilla: "/pa/units/sea/scilla/scilla.json",
      scillaAmmo: "/pa/units/sea/scilla/scilla_ammo.json",
      scillaWeapon: "/pa/units/sea/scilla/scilla_tool_weapon.json",
      shah: "/pa/units/land/shah/shah.json",
      shahAmmo: "/pa/units/land/shah/shah_ammo.json",
      shahWeapon: "/pa/units/land/shah/shah_tool_weapon.json",
      shrapnel: "/pa/units/base/shrapnel/shrapnel.json",
      shrapnelAmmo: "/pa/units/base/shrapnel/shrapnel_ammo.json",
      shrapnelWeapon: "/pa/units/base/shrapnel/shrapnel_tool_weapon.json",
      shrike: "/pa/units/air/swordfish/swordfish.json",
      shrikeAmmo: "/pa/units/air/swordfish/swordfish_ammo.json",
      shrikeWeapon: "/pa/units/air/swordfish/swordfish_tool_weapon.json",
      skipper: "/pa/units/sea/t_hover_skiff/t_hover_skiff.json",
      skipperAmmo: "/pa/units/sea/t_hover_skiff/t_hover_skiff_ammo.json",
      skipperWeapon:
        "/pa/units/sea/t_hover_skiff/t_hover_skiff_tool_weapon.json",
      stork: "/pa/units/air/t_transport/t_transport.json",
      strategicMissileLauncher:
        "/pa/units/land/missile_facility/missile_facility.json",
      strategicMissileLauncherWeapon:
        "/pa/units/land/missile_facility/missile_facility_tool_weapon.json",
      taipan: "/pa/units/land/hunter/hunter.json",
      taipanAmmo: "/pa/units/land/hunter/hunter_ammo.json",
      taipanWeapon: "/pa/units/land/hunter/hunter_weapon.json",
      tankFactory: "/pa/units/land/t_tank_fac/t_tank_fac.json",
      tankFactoryAdvanced: "/pa/units/land/t_tank_fac_adv/t_tank_fac_adv.json",
      tankFactoryAdvancedBuildArm:
        "/pa/units/land/t_tank_fac_adv/t_tank_fac_adv_build_arm.json",
      tankFactoryBuildArm:
        "/pa/units/land/t_tank_fac/t_tank_fac_build_arm.json",
      tarantula: "/pa/units/land/t_bot_aa/t_bot_aa.json",
      tarantulaAmmo: "/pa/units/land/t_bot_aa/t_bot_aa_ammo.json",
      tarantulaInterceptionAmmo:
        "/pa/units/land/t_bot_aa/t_bot_aa_interception_ammo.json",
      tarantulaToolInterception:
        "/pa/units/land/t_bot_aa/t_bot_aa_tool_interception.json",
      tarantulaToolTracer: "/pa/units/land/t_bot_aa/tool_tracer.json",
      tarantulaTracerAmmo: "/pa/units/land/t_bot_aa/tracer_ammo.json",
      tarantulaWeapon: "/pa/units/land/t_bot_aa/t_bot_aa_weapon.json",
      taurusCommander: "/pa/units/commanders/exiles_taurus/exiles_taurus.json",
      taurusCommanderAmmo:
        "/pa/units/commanders/exiles_taurus/exiles_taurus_ammo.json",
      taurusCommanderBuildArm:
        "/pa/units/commanders/exiles_taurus/exiles_taurus_build_arm.json",
      taurusCommanderToolAaWeapon:
        "/pa/units/commanders/exiles_taurus/exiles_taurus_tool_aa_weapon.json",
      taurusCommanderUberCannon:
        "/pa/units/commanders/exiles_taurus/uber_cannon.json",
      taurusCommanderUberShot:
        "/pa/units/commanders/exiles_taurus/uber_shot.json",
      taurusCommanderWeapon:
        "/pa/units/commanders/exiles_taurus/exiles_taurus_tool_weapon.json",
      teleporter: "/pa/units/addon/r_teleporter/r_teleporter.json",
      tideAssembly: "/pa/units/sea/t_naval_fac/t_naval_fac.json",
      tideAssemblyBuildArm:
        "/pa/units/sea/t_naval_fac/t_naval_fac_build_arm.json",
      tin: "/pa/units/land/tin/tin.json",
      tinAmmo: "/pa/units/land/tin/tin_ammo.json",
      tinButDead: "/pa/units/land/tin/dead/tin_ded.json",
      tinButDeadAmmo: "/pa/units/land/tin/dead/tin_ded_ammo.json",
      tinButDeadDeathWeapon:
        "/pa/units/land/tin/dead/tin_ded_death_weapon.json",
      tinWeapon: "/pa/units/land/tin/tin_tool_weapon.json",
      torch: "/pa/units/land/torch/torch.json",
      torchAmmo: "/pa/units/land/torch/torch_ammo.json",
      torchWeapon: "/pa/units/land/torch/torch_weapon.json",
      torpedoLauncher: "/pa/units/sea/t_torp_launcher/t_torp_launcher.json",
      torpedoLauncherAdvanced:
        "/pa/units/sea/t_torp_launcher_adv/t_torp_launcher_adv.json",
      toxicGasTurret: "/pa/units/land/bug_gas_turret/bug_gas_turret.json",
      toxicGasTurretAmmo:
        "/pa/units/land/bug_gas_turret/bug_gas_turret_ammo.json",
      toxicGasTurretWeapon:
        "/pa/units/land/bug_gas_turret/bug_gas_turret_weapon.json",
      tremble: "/pa/units/land/seizmic/seizmic.json",
      ulua: "/pa/units/sea/drone_aa/drone_aa.json",
      uluaAmmoDrone: "/pa/units/sea/drone_aa/drone_aa_ammo_drone.json",
      uluaLightAmmo: "/pa/units/sea/drone_aa/drone_aa_light_ammo.json",
      uluaToolAa: "/pa/units/sea/drone_aa/drone_aa_tool_aa.json",
      uluaToolDrone: "/pa/units/sea/drone_aa/drone_aa_tool_drone.json",
      umbrella: "/pa/units/addon/r_umbrella/r_umbrella.json",
      vehicleFabricatorAdvanced:
        "/pa/units/land/t_tank_fab_adv/t_tank_fab_adv.json",
      vehicleFabricatorAdvancedBuildArm:
        "/pa/units/land/t_tank_fab_adv/t_tank_fab_adv_build_arm.json",
      wall: "/pa/units/land/t_wall/t_wall.json",
    },
    unitNames: {
      advFabricationBot: "!LOC:Adv Fabrication Bot",
      aetherEngine: "Aether Engine",
      airFactory: "Air factory",
      airFactoryAdvanced: "Advanced Air Factory",
      ambushTurret: "!LOC:Ambush Turret",
      ambushTurretDeployed: "!LOC:Ambush Turret (Deployed)",
      antiBallistics: "Anti Ballistics",
      antiNukeLauncher: "!LOC:Anti-Nuke Launcher",
      atropa: "!LOC:Atropa",
      auroraTurret: "Aurora Turret",
      basicMetalExtractor: "Basic Metal Extractor",
      blueberryCommander: "Blueberry Commander",
      bolt: "Bolt",
      botFactory: "!LOC:Bot Factory",
      botFactoryAdvanced: "!LOC:Advanced Bot Factory",
      brainiacCommander: "Brainiac Commander",
      brick: "Brick",
      cape: "Cape",
      catalyst: "Catalyst",
      chimera: "Chimera",
      chirp: "!LOC:Chirp",
      cobra: "!LOC:Cobra",
      cougar: "Cougar",
      crocodile: "Crocodile",
      cub: "Cub",
      cyclone: "Cyclone",
      cyclops: "Cyclops",
      dragonfly: "Dragonfly",
      eagleOwl: "Eagle-Owl",
      energyPylon: "Energy Pylon",
      energyStorage: "!LOC:Energy Storage",
      experimentalMetalStorage: "Experimental Metal Storage",
      fabricationAircraft: "Fabrication Aircraft",
      fabricationComplex: "!LOC:Fabrication Complex",
      fabricationCrawler: "!LOC:Fabrication Crawler",
      fabricationFlyer: "!LOC:Fabrication Flyer",
      fabricationShip: "!LOC:Fabrication Ship",
      fabricationShipAdvanced: "!LOC:Advanced Fabrication Ship",
      fabricationVehicle: "Fabrication Vehicle",
      fiend: "Fiend",
      folga: "Folga",
      gargoyle: "!LOC:Gargoyle",
      hail: "Hail",
      halley: "Halley",
      hardtack: "Hardtack",
      harperTurret: "Harper Turret",
      hellnewBall: "Hellnew/ball",
      heron: "Heron",
      hoverFabricator: "Hover Fabricator",
      hoverFabricatorAdvanced: "Advanced Hover Fabricator",
      hyena: "!LOC:Hyena",
      hyperTideAssembly: "!LOC:Hyper Tide Assembly",
      jaguar: "!LOC:Jaguar",
      jelly: "Jelly",
      kikimora: "Kikimora",
      lamya: "!LOC:Lamya",
      lanceDox: "Lance Dox",
      landMine: "!LOC:Land Mine",
      leviathan: "Leviathan",
      lice: "Lice",
      maximCommander: "Maxim Commander",
      meerkat: "Meerkat",
      metalExtractorAdvanced: "!LOC:Advanced Metal Extractor",
      moray: "Moray",
      needletail: "Needletail",
      nukeMine: "!LOC:Nuke Mine",
      ocelot: "Ocelot",
      orbitalLauncher: "!LOC:Orbital Launcher",
      overchargedAdvancedReactor: "!LOC:Overcharged Advanced Reactor",
      overchargedEnergyPylon: "Overcharged Energy Pylon",
      puma: "Puma",
      quadTurret: "!LOC:Quad Turret",
      radar: "!LOC:Radar",
      reactor: "!LOC:Reactor",
      reactorAdvanced: "!LOC:Advanced Reactor",
      reconAmmo: "Recon Ammo",
      redkite: "Redkite",
      rhino: "Rhino",
      scilla: "Scilla",
      shah: "Shah",
      shrapnel: "Shrapnel",
      shrike: "!LOC:Shrike",
      skipper: "Skipper",
      stork: "Stork",
      strategicMissileLauncher: "!LOC:Strategic Missile Launcher",
      taipan: "!LOC:Taipan",
      tankFactory: "Tank factory",
      tankFactoryAdvanced: "Advanced Tank factory",
      tarantula: "Tarantula",
      taurusCommander: "Taurus Commander",
      teleporter: "!LOC:Teleporter",
      tideAssembly: "!LOC:Tide Assembly",
      tin: "Tin",
      tinButDead: "Tin but dead",
      torch: "Torch",
      torpedoLauncher: "!LOC:Torpedo Launcher",
      torpedoLauncherAdvanced: "!LOC:Advanced Torpedo Launcher",
      toxicGasTurret: "Toxic Gas Turret",
      tremble: "!LOC:Tremble",
      ulua: "Ulua",
      umbrella: "Umbrella",
      vehicleFabricatorAdvanced: "Advanced Vehicle Fabricator",
      wall: "Wall",
    },
  };
});
