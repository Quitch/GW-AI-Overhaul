define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (GW, gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Default Commander"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/shared/img/red-commander.png"
    ),
    describe: _.constant(""),
    deal: _.constant(false),
    buff: function (inventory) {
      inventory.maxCards(
        inventory.maxCards() + GW.balance.initialCardSlots + 1
      );

      gwaioCards.setupCluster(inventory);

      // Correct issues which affect buffs being applied correctly
      inventory.addMods([
        {
          // Slammer torpedo should be encompassed in bot buffs not structures'
          file: gwaioUnits.slammerTorpedo,
          path: "ammo_id",
          op: "replace",
          value: gwaioUnits.slammerTorpedoAmmo,
        },
        {
          // Match the damage of the previous ammo
          file: gwaioUnits.slammerTorpedoAmmo,
          path: "damage",
          op: "multiply",
          value: 2.5,
        },
      ]);

      var commander = inventory.getTag("global", "commander");
      commander && inventory.addUnits([commander]);
      inventory.addUnits([
        // Economy
        "/pa/units/land/energy_plant/energy_plant.json",
        "/pa/units/land/energy_plant_adv/energy_plant_adv.json",
        //'/pa/units/land/energy_storage/energy_storage.json',
        "/pa/units/land/metal_extractor/metal_extractor.json",
        "/pa/units/land/metal_extractor_adv/metal_extractor_adv.json",
        //'/pa/units/land/metal_storage/metal_storage.json',
        // T1 Vehicles
        //'/pa/units/land/vehicle_factory/vehicle_factory.json',
        "/pa/units/land/fabrication_vehicle/fabrication_vehicle.json",
        //'/pa/units/land/tank_light_laser/tank_light_laser.json',
        //'/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json',
        //'/pa/units/land/tank_armor/tank_armor.json',
        //'/pa/units/land/tank_hover/tank_hover.json',
        "/pa/units/land/land_scout/land_scout.json",
        // '/pa/units/land/attack_vehicle/attack_vehicle.json',
        // T2 Vehicles
        //'/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json',
        "/pa/units/land/fabrication_vehicle_adv/fabrication_vehicle_adv.json",
        "/pa/units/land/tank_laser_adv/tank_laser_adv.json",
        "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
        "/pa/units/land/tank_heavy_mortar/tank_heavy_mortar.json",
        "/pa/units/land/tank_flak/tank_flak.json",
        "/pa/units/land/tank_nuke/tank_nuke.json",
        // T1 Bots
        //'/pa/units/land/bot_factory/bot_factory.json',
        "/pa/units/land/fabrication_bot/fabrication_bot.json",
        //'/pa/units/land/fabrication_bot_combat/fabrication_bot_combat.json',
        //'/pa/units/land/assault_bot/assault_bot.json',
        //'/pa/units/land/bot_grenadier/bot_grenadier.json',
        //'/pa/units/land/bot_bomb/bot_bomb.json',
        //'/pa/units/land/bot_tesla/bot_tesla.json',
        //'/pa/units/land/bot_aa/bot_aa.json',
        // T2 Bots
        //'/pa/units/land/bot_factory_adv/bot_factory_adv.json',
        "/pa/units/land/fabrication_bot_adv/fabrication_bot_adv.json",
        "/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv.json",
        "/pa/units/land/assault_bot_adv/assault_bot_adv.json",
        "/pa/units/land/bot_tactical_missile/bot_tactical_missile.json",
        "/pa/units/land/bot_sniper/bot_sniper.json",
        "/pa/units/land/bot_nanoswarm/bot_nanoswarm.json",
        "/pa/units/land/bot_support_commander/bot_support_commander.json",
        // T1 Air
        //'/pa/units/air/air_factory/air_factory.json',
        "/pa/units/air/fabrication_aircraft/fabrication_aircraft.json",
        //'/pa/units/air/air_scout/air_scout.json',
        //'/pa/units/air/bomber/bomber.json',
        //'/pa/units/air/fighter/fighter.json',
        //'/pa/units/air/transport/transport.json',
        //'/pa/units/air/solar_drone/solar_drone.json',
        // T2 Air
        //'/pa/units/air/air_factory_adv/air_factory_adv.json',
        "/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv.json",
        "/pa/units/air/bomber_adv/bomber_adv.json",
        "/pa/units/air/fighter_adv/fighter_adv.json",
        "/pa/units/air/gunship/gunship.json",
        "/pa/units/air/bomber_heavy/bomber_heavy.json",
        "/pa/units/air/support_platform/support_platform.json",
        "/pa/units/air/strafer/strafer.json",
        // T1 Sea
        "/pa/units/sea/naval_factory/naval_factory.json",
        "/pa/units/sea/fabrication_ship/fabrication_ship.json",
        "/pa/units/sea/frigate/frigate.json",
        "/pa/units/sea/destroyer/destroyer.json",
        "/pa/units/sea/sea_scout/sea_scout.json",
        "/pa/units/sea/attack_sub/attack_sub.json",
        "/pa/units/sea/fabrication_barge/fabrication_barge.json",
        // T2 Sea
        //'/pa/units/sea/naval_factory_adv/naval_factory_adv.json',
        "/pa/units/sea/fabrication_ship_adv/fabrication_ship_adv.json",
        "/pa/units/sea/missile_ship/missile_ship.json",
        "/pa/units/sea/battleship/battleship.json",
        "/pa/units/sea/nuclear_sub/nuclear_sub.json",
        "/pa/units/sea/hover_ship/hover_ship.json",
        "/pa/units/sea/drone_carrier/carrier/carrier.json",
        "/pa/units/sea/drone_carrier/drone/drone.json",
        // T1 Orbital
        "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
        "/pa/units/orbital/orbital_launcher/orbital_launcher.json",
        "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
        "/pa/units/orbital/ion_defense/ion_defense.json",
        "/pa/units/orbital/orbital_fighter/orbital_fighter.json",
        "/pa/units/orbital/orbital_lander/orbital_lander.json",
        "/pa/units/orbital/orbital_probe/orbital_probe.json",
        //'/pa/units/orbital/radar_satellite/radar_satellite.json',
        //'/pa/units/orbital/solar_array/solar_array.json',
        // T2 Orbital
        //'/pa/units/orbital/orbital_factory/orbital_factory.json',
        "/pa/units/orbital/defense_satellite/defense_satellite.json",
        "/pa/units/orbital/delta_v_engine/delta_v_engine.json",
        "/pa/units/orbital/orbital_laser/orbital_laser.json",
        "/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json",
        //'/pa/units/orbital/mining_platform/mining_platform.json',
        "/pa/units/orbital/orbital_railgun/orbital_railgun.json",
        "/pa/units/orbital/orbital_battleship/orbital_battleship.json",
        // T1 Defenses
        "/pa/units/land/land_barrier/land_barrier.json",
        "/pa/units/land/land_mine/land_mine.json",
        "/pa/units/land/air_defense/air_defense.json",
        "/pa/units/land/laser_defense_single/laser_defense_single.json",
        "/pa/units/land/laser_defense/laser_defense.json",
        //'/pa/units/land/artillery_short/artillery_short.json',
        //'/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json',
        "/pa/units/sea/torpedo_launcher/torpedo_launcher.json",
        // T2 Defenses
        //'/pa/units/land/air_defense_adv/air_defense_adv.json',
        //'/pa/units/land/laser_defense_adv/laser_defense_adv.json',
        //'/pa/units/land/artillery_long/artillery_long.json',
        "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher.json",
        //'/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json',
        "/pa/units/land/nuke_launcher/nuke_launcher.json",
        //'/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json',
        "/pa/units/land/control_module/control_module.json",
        // T1 Intel
        "/pa/units/land/radar/radar.json",
        "/pa/units/land/teleporter/teleporter.json",
        // T2 Intel
        "/pa/units/land/radar_adv/radar_adv.json",
        // Unit Cannon
        "/pa/units/land/unit_cannon/unit_cannon.json",
        // Titans
        // '/pa/units/land/titan_bot/titan_bot.json',
        // '/pa/units/land/titan_vehicle/titan_vehicle.json',
        // '/pa/units/land/titan_air/titan_air.json',
        // '/pa/units/land/titan_structure/titan_structure.json',
        // '/pa/units/land/titan_orbital/titan_orbital.json'
      ]);
    },
    dull: function () {
      // empty
    },
  };
});
