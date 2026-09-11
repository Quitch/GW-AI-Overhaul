// Osmech as a Galactic War add-on: MLA units, many of them Titans, and no AI
// data. `units` keys every spec the mod adds by a name of its own (the same
// shape as shared/units.js) and `unitNames` carries the display names by the
// same keys. What a player fields follows from capability cells. See
// races.md, "Add-ons".
define(function () {
  return {
    id: "osmech",
    name: "!LOC:Osmech",
    serverMods: ["com.pa.loloares.thorosmen"],
    layers: {},
    units: {
      aegis: "/pa/units/thorosmen/tank_shield/tank_shield.json",
      aegisWeaponEasyWeapon:
        "/pa/units/thorosmen/tank_shield/tank_shield_weapon_easy.json",
      aegisAmmoEasyAmmo:
        "/pa/units/thorosmen/tank_shield/tank_shield_ammo_easy.json",
      aegisWeaponMidWeapon:
        "/pa/units/thorosmen/tank_shield/tank_shield_weapon_mid.json",
      aegisAmmoMidAmmo:
        "/pa/units/thorosmen/tank_shield/tank_shield_ammo_mid.json",
      aegisWeaponHardWeapon:
        "/pa/units/thorosmen/tank_shield/tank_shield_weapon_hard.json",
      aegisAmmoHardAmmo:
        "/pa/units/thorosmen/tank_shield/tank_shield_ammo_hard.json",
      aegisLShieldGenDeathAmmo:
        "/pa/units/thorosmen/tank_shield/l_shield_gen_death.json",
      angryTree: "/pa/units/thorosmen/bot_tree/bot_tree.json",
      angryTreeWeapon: "/pa/units/thorosmen/bot_tree/bot_tree_tool_weapon.json",
      angryTreeAmmo: "/pa/units/thorosmen/bot_tree/bot_tree_ammo.json",
      atAt: "/pa/units/thorosmen/atat/atat.json",
      atAtLandWeapon: "/pa/units/thorosmen/atat/atat_land_tool_weapon.json",
      atAtLandAmmo: "/pa/units/thorosmen/atat/atat_land_ammo.json",
      atAtAirWeapon: "/pa/units/thorosmen/atat/atat_air_tool_weapon.json",
      atAtAirAmmo: "/pa/units/thorosmen/atat/atat_air_ammo.json",
      atAtDeathAmmo: "/pa/ammo/st_ammo_death/st_ammo_death.json",
      babyDonut: "/pa/units/thorosmen/tank_decoy_little/tank_decoy_little.json",
      babyDonutWeapon:
        "/pa/units/thorosmen/tank_decoy_little/tank_decoy_little_tool_weapon.json",
      babyDonutAmmo:
        "/pa/units/thorosmen/tank_decoy_little/tank_decoy_little_ammo.json",
      beenado: "/pa/units/thorosmen/tank_drone/tank_drone/tank_drone.json",
      beenadoWeapon:
        "/pa/units/thorosmen/tank_drone/tank_drone/tank_drone_tool_weapon.json",
      beenadoAmmo:
        "/pa/units/thorosmen/tank_drone/tank_drone/tank_drone_ammo.json",
      binho: "/pa/units/thorosmen/binho/binho.json",
      binhoToolCuWeapon: "/pa/units/thorosmen/binho/binho_tool_cu.json",
      binhoAmmo: "/pa/units/thorosmen/binho/binho_ammo.json",
      binhoWeapon: "/pa/units/thorosmen/binho/binho_tool_weapon.json",
      bunker: "/pa/units/thorosmen/bunker_build/bunker/bunker.json",
      bunkerAmmoDeathAmmo:
        "/pa/units/thorosmen/bunker_build/bunker_orb/bunker_ammo_death.json",
      bunkerBuild: "/pa/units/thorosmen/bunker_build/bunker_build.json",
      bunkerBuildToolWeaponOrbWeapon:
        "/pa/units/thorosmen/bunker_build/bunker_build_tool_weapon_orb.json",
      bunkerBuildAmmoOrbAmmo:
        "/pa/units/thorosmen/bunker_build/bunker_build_ammo_orb.json",
      bunkerBuildWeapon:
        "/pa/units/thorosmen/bunker_build/bunker_build_tool_weapon.json",
      bunkerBuildAmmo:
        "/pa/units/thorosmen/bunker_build/bunker_build_ammo.json",
      daddyDonut: "/pa/units/thorosmen/tank_decoy/tank_decoy.json",
      daddyDonutWeapon:
        "/pa/units/thorosmen/tank_decoy/tank_decoy_tool_weapon.json",
      daddyDonutAmmo: "/pa/units/thorosmen/tank_decoy/tank_decoy_ammo.json",
      dagua: "/pa/units/thorosmen/dagua/dagua.json",
      daguaWeapon: "/pa/units/thorosmen/dagua/dagua_tool_weapon.json",
      daguaAmmo: "/pa/units/thorosmen/dagua/dagua_ammo.json",
      drill: "/pa/units/thorosmen/drill/drill.json",
      drillWeapon: "/pa/units/thorosmen/drill/drill_tool_weapon.json",
      drillAmmo: "/pa/units/thorosmen/drill/drill_ammo.json",
      drillEffectWeapon:
        "/pa/units/thorosmen/drill/drill_effect_tool_weapon.json",
      drillEffectAmmo: "/pa/units/thorosmen/drill/drill_effect_ammo.json",
      elysium: "/pa/units/thorosmen/air_healer/air_healer.json",
      elysiumWeapon: "/pa/units/thorosmen/air_healer/air_healer_tool.json",
      elysiumAmmo: "/pa/units/thorosmen/air_healer/air_healer_ammo.json",
      elysiumTool2Weapon:
        "/pa/units/thorosmen/air_healer/air_healer_tool2.json",
      elysiumAmmo2Ammo: "/pa/units/thorosmen/air_healer/air_healer_ammo2.json",
      fef: "/pa/units/thorosmen/st_fef/st_fef.json",
      fefWeapon: "/pa/units/thorosmen/st_fef/st_fef_tool_weapon.json",
      fefAmmo: "/pa/units/thorosmen/st_fef/st_fef_ammo.json",
      fefDeathAmmo: "/pa/ammo/st_ammo_death/st_ammo_death.json",
      flyingSpider:
        "/pa/units/thorosmen/bot_drone/boombot_air/boombot_air.json",
      flyingSpiderWeapon:
        "/pa/units/thorosmen/bot_drone/boombot_air/boombot_air_tool_weapon.json",
      flyingSpiderAmmo:
        "/pa/units/thorosmen/bot_drone/boombot_air/boombot_air_ammo.json",
      flyingSpiderLifeWeapon:
        "/pa/units/thorosmen/bot_drone/boombot_air/boombot_air_life_tool_weapon.json",
      flyingSpiderLifePbaoeAmmo:
        "/pa/units/thorosmen/bot_drone/boombot_air/boombot_air_life_pbaoe.json",
      flyingSpiderDeathAmmo: "/pa/ammo/air_pbaoe/air_pbaoe.json",
      freezer: "/pa/units/thorosmen/bot_freeze/bot_freeze.json",
      freezerWeapon:
        "/pa/units/thorosmen/bot_freeze/bot_freeze_tool_weapon.json",
      freezerAmmo: "/pa/units/thorosmen/bot_freeze/bot_freeze_ammo.json",
      gilF: "/pa/units/thorosmen/bot_sniper_big/bot_sniper_big.json",
      gilFWeapon:
        "/pa/units/thorosmen/bot_sniper_big/bot_sniper_big_tool_weapon.json",
      gilFAmmo: "/pa/units/thorosmen/bot_sniper_big/bot_sniper_big_ammo.json",
      gungnir: "/pa/units/thorosmen/gigatank/gigatank.json",
      gungnirWeapon: "/pa/units/thorosmen/gigatank/gigatank_tool_weapon.json",
      gungnirAmmo: "/pa/units/thorosmen/gigatank/gigatank_ammo.json",
      halabib: "/pa/units/thorosmen/halabib/halabib.json",
      halabibWeapon: "/pa/units/thorosmen/halabib/halabib_tool_weapon.json",
      halabibAmmo: "/pa/units/thorosmen/halabib/halabib_ammo.json",
      healSpellFactory: "/pa/units/thorosmen/spell_heal/spell_heal.json",
      healSpellFactoryWeapon:
        "/pa/units/thorosmen/spell_heal/spell_heal_tool_weapon.json",
      healSpellFactoryAmmo:
        "/pa/units/thorosmen/spell_heal/spell_heal_ammo.json",
      healSpellFactoryBuildArm:
        "/pa/units/thorosmen/spell_heal/spell_heal_build_arm.json",
      ilegal: "/pa/units/thorosmen/st_ilegal/st_ilegal.json",
      ilegalWeapon: "/pa/units/thorosmen/st_ilegal/st_ilegal_tool_weapon.json",
      ilegalMissilAmmo: "/pa/units/thorosmen/st_ilegal/missil_ammo.json",
      ilegalDeathAmmo: "/pa/ammo/st_ammo_death/st_ammo_death.json",
      jonas: "/pa/units/thorosmen/canhao/canhao.json",
      jonasWeapon: "/pa/units/thorosmen/canhao/canhao_tool_weapon.json",
      jonasAmmo: "/pa/units/thorosmen/canhao/canhao_ammo.json",
      kamecha: "/pa/units/thorosmen/st_bot_white_hole/st_bot_white_hole.json",
      kamechaWeapon:
        "/pa/units/thorosmen/st_bot_white_hole/st_bot_white_hole_tool_weapon.json",
      kamechaAmmo:
        "/pa/units/thorosmen/st_bot_white_hole/st_bot_white_hole_ammo.json",
      kamechaDeathAmmo: "/pa/ammo/st_ammo_death/st_ammo_death.json",
      kinha: "/pa/units/thorosmen/kinha/kinha.json",
      kinhaWeapon: "/pa/units/thorosmen/kinha/kinha_tool_weapon.json",
      kinhaAmmo: "/pa/units/thorosmen/kinha/kinha_ammo.json",
      knalhaZx: "/pa/units/thorosmen/cuzeta/cuzeta.json",
      knalhaZxWeapon: "/pa/units/thorosmen/cuzeta/cuzeta_tool_weapon.json",
      knalhaZxAmmo: "/pa/units/thorosmen/cuzeta/cuzeta_ammo.json",
      knalhaZxTorpedoWeapon:
        "/pa/units/thorosmen/cuzeta/cuzeta_torpedo_tool_weapon.json",
      knalhaZxAmmo2:
        "/pa/units/sea/torpedo_launcher/torpedo_launcher_ammo.json",
      lawnmower: "/pa/units/thorosmen/st_lawnmower/st_lawnmower.json",
      lawnmowerWeapon:
        "/pa/units/thorosmen/st_lawnmower/st_lawnmower_weapon.json",
      lawnmowerAmmo: "/pa/units/thorosmen/st_lawnmower/st_lawnmower_ammo.json",
      lawnmowerMetalDestructorWeapon:
        "/pa/units/thorosmen/st_lawnmower/metal_destructor_tool_weapon.json",
      lawnmowerWhiteHoleAmmo:
        "/pa/units/thorosmen/st_lawnmower/white_hole_ammo.json",
      lawnmowerLShieldGenLongWeapon:
        "/pa/units/thorosmen/st_lawnmower/l_shield_gen_long_tool_weapon.json",
      lawnmowerLShieldGenAmmo:
        "/pa/units/thorosmen/st_lawnmower/l_shield_gen_ammo.json",
      lawnmowerDeathAmmo: "/pa/ammo/st_ammo_death/st_ammo_death.json",
      lolis: "/pa/units/thorosmen/lolis/lolis.json",
      lz130Hindenburg: "/pa/units/thorosmen/st_airship/st_airship.json",
      lz130HindenburgToolWeaponMissileWeapon:
        "/pa/units/thorosmen/st_airship/st_airship_tool_weapon_missile.json",
      lz130HindenburgAmmoMissileAmmo:
        "/pa/units/thorosmen/st_airship/st_airship_ammo_missile.json",
      lz130HindenburgOrbitalBattleshipToolWeaponGroundWeapon:
        "/pa/units/thorosmen/st_airship/orbital_battleship_tool_weapon_ground.json",
      lz130HindenburgOrbitalBattleshipAmmoGroundAmmo:
        "/pa/units/thorosmen/st_airship/orbital_battleship_ammo_ground.json",
      lz130HindenburgOrbitalBattleshipWeapon:
        "/pa/units/thorosmen/st_airship/orbital_battleship_tool_weapon.json",
      lz130HindenburgOrbitalBattleshipAmmo:
        "/pa/units/thorosmen/st_airship/orbital_battleship_ammo.json",
      lz130HindenburgAmmoDeathAmmo:
        "/pa/units/thorosmen/st_airship/st_airship_ammo_death.json",
      metalAssimilator:
        "/pa/units/thorosmen/metal_destructor/metal_destructor.json",
      metalAssimilatorWeapon:
        "/pa/units/thorosmen/metal_destructor/metal_destructor_tool_weapon.json",
      metalAssimilatorPbaoeAmmo:
        "/pa/units/thorosmen/metal_destructor/metal_destructor_pbaoe.json",
      pap: "/pa/units/thorosmen/st_pap/st_pap.json",
      papWeapon: "/pa/units/thorosmen/st_pap/weapon.json",
      papAmmo: "/pa/units/thorosmen/st_pap/ammo.json",
      papDeathAmmo: "/pa/ammo/st_ammo_death/st_ammo_death.json",
      prado: "/pa/units/thorosmen/bumba/bumba.json",
      pradoWeapon: "/pa/units/thorosmen/bumba/bumba_tool_weapon.json",
      pradoAmmo: "/pa/units/thorosmen/bumba/bumba_ammo.json",
      pulverizer: "/pa/units/thorosmen/prex/prex.json",
      pulverizerWeapon: "/pa/units/thorosmen/prex/prex_tool_weapon.json",
      pulverizerAmmo: "/pa/units/thorosmen/prex/prex_ammo.json",
      rainbringer: "/pa/units/thorosmen/st_colum/st_colum.json",
      rainbringerWeapon:
        "/pa/units/thorosmen/st_colum/st_colum_tool_weapon.json",
      rainbringerAmmo: "/pa/units/thorosmen/st_colum/st_colum_ammo.json",
      rainbringerDeathAmmo: "/pa/ammo/st_ammo_death/st_ammo_death.json",
      sakura: "/pa/units/thorosmen/bot_drone/bot_drone.json",
      sakuraWeapon: "/pa/units/thorosmen/bot_drone/bot_drone_tool_weapon.json",
      sakuraAmmo: "/pa/units/thorosmen/bot_drone/bot_drone_ammo.json",
      sauron: "/pa/units/thorosmen/titan_radar/titan_radar.json",
      skyBreaker: "/pa/units/thorosmen/maciota/maciota.json",
      skyBreakerWeapon: "/pa/units/thorosmen/maciota/maciota_tool_weapon.json",
      skyBreakerAmmo: "/pa/units/thorosmen/maciota/maciota_ammo.json",
      skyBreakerToolAntidropWeapon:
        "/pa/units/orbital/ion_defense/ion_defense_tool_antidrop.json",
      skyBreakerAntidropAmmo:
        "/pa/units/orbital/ion_defense/ion_defense_antidrop_ammo.json",
      spartak: "/pa/units/thorosmen/bot_tp/bot_tp.json",
      spartakWeapon: "/pa/units/thorosmen/bot_tp/bot_tp_tool_weapon.json",
      spartakAmmo: "/pa/units/thorosmen/bot_tp/bot_tp_ammo.json",
      spartakWeapon2: "/pa/units/land/bot_tesla/bot_tesla_tool_weapon.json",
      spartakAmmo2: "/pa/units/land/bot_tesla/bot_tesla_ammo.json",
      stGgspider:
        "/pa/units/thorosmen/st_ggspider_build/st_ggspider/st_ggspider.json",
      stGgspiderWeapon:
        "/pa/units/thorosmen/st_ggspider_build/st_ggspider/st_ggspider_weapon.json",
      stGgspiderAmmo: "/pa/units/land/assault_bot/assault_bot_ammo.json",
      stGgspiderBuild:
        "/pa/units/thorosmen/st_ggspider_build/st_ggspider_build.json",
      stGgspiderBuildWeapon:
        "/pa/units/thorosmen/st_ggspider_build/st_ggspider_build_tool_weapon.json",
      stGgspiderBuildAmmo:
        "/pa/units/thorosmen/st_ggspider_build/st_ggspider_build_ammo.json",
      theEgg: "/pa/units/thorosmen/titan_egg_build/titan_egg_build.json",
      theEggWeaponStGgspiderWeapon:
        "/pa/units/thorosmen/titan_egg_build/weapon_st_ggspider.json",
      theEggAmmoStGgspiderAmmo:
        "/pa/units/thorosmen/titan_egg_build/ammo_st_ggspider.json",
      theEggWeaponStLawnmowerWeapon:
        "/pa/units/thorosmen/titan_egg_build/weapon_st_lawnmower.json",
      theEggAmmoStLawnmowerAmmo:
        "/pa/units/thorosmen/titan_egg_build/ammo_st_lawnmower.json",
      theEggWeaponKamechaWeapon:
        "/pa/units/thorosmen/titan_egg_build/weapon_kamecha.json",
      theEggAmmoKamechaAmmo:
        "/pa/units/thorosmen/titan_egg_build/ammo_kamecha.json",
      theEggWeaponStIlegalWeapon:
        "/pa/units/thorosmen/titan_egg_build/weapon_st_ilegal.json",
      theEggAmmoStIlegalAmmo:
        "/pa/units/thorosmen/titan_egg_build/ammo_st_ilegal.json",
      theEggWeaponStPapWeapon:
        "/pa/units/thorosmen/titan_egg_build/weapon_st_pap.json",
      theEggAmmoStPapAmmo:
        "/pa/units/thorosmen/titan_egg_build/ammo_st_pap.json",
      theEggWeaponStFefWeapon:
        "/pa/units/thorosmen/titan_egg_build/weapon_st_fef.json",
      theEggAmmoStFefAmmo:
        "/pa/units/thorosmen/titan_egg_build/ammo_st_fef.json",
      theEggWeaponTobleroneWeapon:
        "/pa/units/thorosmen/titan_egg_build/weapon_toblerone.json",
      theEggAmmoTobleroneAmmo:
        "/pa/units/thorosmen/titan_egg_build/ammo_toblerone.json",
      theEggWeaponHindenburgWeapon:
        "/pa/units/thorosmen/titan_egg_build/weapon_hindenburg.json",
      theEggAmmoHindenburgAmmo:
        "/pa/units/thorosmen/titan_egg_build/ammo_hindenburg.json",
      theEggWeaponStColumWeapon:
        "/pa/units/thorosmen/titan_egg_build/weapon_st_colum.json",
      theEggAmmoStColumAmmo:
        "/pa/units/thorosmen/titan_egg_build/ammo_st_colum.json",
      theEggWeaponTripodWeapon:
        "/pa/units/thorosmen/titan_egg_build/weapon_tripod.json",
      theEggAmmoTripodAmmo:
        "/pa/units/thorosmen/titan_egg_build/ammo_tripod.json",
      theEggWeaponAtatWeapon:
        "/pa/units/thorosmen/titan_egg_build/weapon_atat.json",
      theEggAmmoAtatAmmo: "/pa/units/thorosmen/titan_egg_build/ammo_atat.json",
      theEggWeaponElysiumWeapon:
        "/pa/units/thorosmen/titan_egg_build/weapon_elysium.json",
      theEggAmmoElysiumAmmo:
        "/pa/units/thorosmen/titan_egg_build/ammo_elysium.json",
      thorondor: "/pa/units/thorosmen/thorondor/thorondor.json",
      toblerone: "/pa/units/thorosmen/st_bot_anti_nuke/st_bot_anti_nuke.json",
      tobleroneWeapon:
        "/pa/units/thorosmen/st_bot_anti_nuke/st_bot_anti_nuke_tool_weapon.json",
      tobleroneAmmo:
        "/pa/units/thorosmen/st_bot_anti_nuke/st_bot_anti_nuke_ammo.json",
      tripod: "/pa/units/thorosmen/tripod/tripod.json",
      tripodWeapon: "/pa/units/thorosmen/tripod/tripod_tool_weapon.json",
      tripodAmmo: "/pa/units/thorosmen/tripod/tripod_ammo.json",
      tripodToolWeaponTacticalWeapon:
        "/pa/units/thorosmen/tripod/tripod_tool_weapon_tactical.json",
      tripodAmmoTacticalAmmo:
        "/pa/units/thorosmen/tripod/tripod_ammo_tactical.json",
      tripodDeathAmmo: "/pa/ammo/st_ammo_death/st_ammo_death.json",
      usedSpartak:
        "/pa/units/thorosmen/bot_tp/bot_tesla_tped/bot_tesla_tped.json",
      usedSpartakWeapon: "/pa/units/land/bot_tesla/bot_tesla_tool_weapon.json",
      usedSpartakAmmo: "/pa/units/land/bot_tesla/bot_tesla_ammo.json",
      voltar: "/pa/units/thorosmen/healer/healer/healer.json",
      wallF: "/pa/units/thorosmen/bot_shield_wall/bot_shield_wall.json",
      wallFLShieldGenLongToolWeapon2Weapon:
        "/pa/units/thorosmen/bot_shield_wall/l_shield_gen_long_tool_weapon_2.json",
      wallFLShieldGenAmmo2Ammo:
        "/pa/units/thorosmen/bot_shield_wall/l_shield_gen_ammo_2.json",
      wallFLShieldGenMidToolWeapon2Weapon:
        "/pa/units/thorosmen/bot_shield_wall/l_shield_gen_mid_tool_weapon_2.json",
      wallFLShieldGenShortToolWeapon2Weapon:
        "/pa/units/thorosmen/bot_shield_wall/l_shield_gen_short_tool_weapon_2.json",
      wallFLShieldGenMiniToolWeapon2Weapon:
        "/pa/units/thorosmen/bot_shield_wall/l_shield_gen_mini_tool_weapon_2.json",
      wallFMetalDestructorWeapon:
        "/pa/units/thorosmen/st_lawnmower/metal_destructor_tool_weapon.json",
      wallFWhiteHoleAmmo:
        "/pa/units/thorosmen/st_lawnmower/white_hole_ammo.json",
      wallFLShieldGenLongWeapon:
        "/pa/units/thorosmen/st_lawnmower/l_shield_gen_long_tool_weapon.json",
      wallFLShieldGenAmmo:
        "/pa/units/thorosmen/st_lawnmower/l_shield_gen_ammo.json",
      wallFLShieldGenDeath2DeathAmmo:
        "/pa/units/thorosmen/bot_shield_wall/l_shield_gen_death_2.json",
    },
    unitNames: {
      aegis: "!LOC:Aegis",
      angryTree: "!LOC:ANGRY TREE",
      atAt: "!LOC:AT-AT",
      babyDonut: "!LOC: baby donut",
      beenado: "!LOC:Beenado",
      binho: "!LOC:Binho",
      bunker: "!LOC:Bunker",
      bunkerBuild: "!LOC:Bunker",
      daddyDonut: "!LOC:Daddy donut",
      dagua: "!LOC:Dagua",
      drill: "!LOC:Drill",
      elysium: "!LOC:Elysium",
      fef: "!LOC:Fef",
      flyingSpider: "!LOC:Flying spider",
      freezer: "!LOC:Freezer",
      gilF: "!LOC:Gil-F",
      gungnir: "!LOC:Gungnir",
      halabib: "!LOC:Halabib",
      healSpellFactory: "!LOC:Heal Spell Factory",
      ilegal: "!LOC:Ilegal",
      jonas: "!LOC:Jonas",
      kamecha: "!LOC:Kamecha",
      kinha: "!LOC:Kinha",
      knalhaZx: "!LOC:Knalha ZX",
      lawnmower: "!LOC:Lawnmower",
      lolis: "!LOC:Lolis",
      lz130Hindenburg: "!LOC:LZ 130 Hindenburg",
      metalAssimilator: "!LOC:Metal Assimilator",
      pap: "!LOC:Pap",
      prado: "!LOC:Prado",
      pulverizer: "!LOC:Pulverizer",
      rainbringer: "!LOC:Rainbringer",
      sakura: "!LOC:Sakura",
      sauron: "!LOC:Sauron",
      skyBreaker: "!LOC:Sky Breaker",
      spartak: "!LOC:Spartak",
      stGgspider: "!LOC:GrayGoo Spider",
      stGgspiderBuild: "!LOC:GrayGoo Spider",
      theEgg: "!LOC:The Egg",
      thorondor: "!LOC:Thorondor",
      toblerone: "!LOC:Toblerone",
      tripod: "!LOC:Tripod",
      usedSpartak: "!LOC:used Spartak",
      voltar: "!LOC:Voltar",
      wallF: "!LOC:Wall-F",
    },
  };
});
