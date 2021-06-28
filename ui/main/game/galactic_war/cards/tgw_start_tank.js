define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/tech.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (module, GWCStart, gwaioBank, gwaioTech, gwaioFunctions) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Buff Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:This Commander prefers quality over quantity and has modified its units to that end. 30% more health, 30% more damage and splash, but 25% slower, and with 30% higher build costs."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Buff Commander",
      };
    },
    deal: function () {
      return {
        params: {
          allowOverflow: true,
        },
        chance: 0,
      };
    },
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          if (inventory.getTag("global", "playerFaction") === 4)
            inventory.addMods(gwaioTech.clusterCommanders);
          inventory.addUnits([
            "/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json",
            "/pa/units/land/attack_vehicle/attack_vehicle.json",
            "/pa/units/land/tank_armor/tank_armor.json",
            "/pa/units/land/tank_hover/tank_hover.json",
            "/pa/units/land/tank_light_laser/tank_light_laser.json",
            "/pa/units/land/vehicle_factory/vehicle_factory.json",
          ]);
          var mods = [];
          var units = [
            "/pa/units/air/air_scout/air_scout.json",
            "/pa/units/air/bomber_adv/bomber_adv.json",
            "/pa/units/air/bomber_heavy/bomber_heavy.json",
            "/pa/units/air/bomber/bomber.json",
            "/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv.json",
            "/pa/units/air/fabrication_aircraft/fabrication_aircraft.json",
            "/pa/units/air/fighter_adv/fighter_adv.json",
            "/pa/units/air/fighter/fighter.json",
            "/pa/units/air/gunship/gunship.json",
            "/pa/units/air/solar_drone/solar_drone.json",
            "/pa/units/air/strafer/strafer.json",
            "/pa/units/air/support_platform/support_platform.json",
            "/pa/units/air/titan_air/titan_air.json",
            "/pa/units/air/transport/transport.json",
            "/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json",
            "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json",
            "/pa/units/land/assault_bot_adv/assault_bot_adv.json",
            "/pa/units/land/assault_bot/assault_bot.json",
            "/pa/units/land/attack_vehicle/attack_vehicle.json",
            "/pa/units/land/bot_aa/bot_aa.json",
            "/pa/units/land/bot_bomb/bot_bomb.json",
            "/pa/units/land/bot_grenadier/bot_grenadier.json",
            "/pa/units/land/bot_nanoswarm/bot_nanoswarm.json",
            "/pa/units/land/bot_sniper/bot_sniper.json",
            "/pa/units/land/bot_support_commander/bot_support_commander.json",
            "/pa/units/land/bot_tactical_missile/bot_tactical_missile.json",
            "/pa/units/land/bot_tesla/bot_tesla.json",
            "/pa/units/land/fabrication_bot_adv/fabrication_bot_adv.json",
            "/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv.json",
            "/pa/units/land/fabrication_bot_combat/fabrication_bot_combat.json",
            "/pa/units/land/fabrication_bot/fabrication_bot.json",
            "/pa/units/land/fabrication_vehicle_adv/fabrication_vehicle_adv.json",
            "/pa/units/land/fabrication_vehicle/fabrication_vehicle.json",
            "/pa/units/land/land_scout/land_scout.json",
            "/pa/units/land/tank_armor/tank_armor.json",
            "/pa/units/land/tank_flak/tank_flak.json",
            "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
            "/pa/units/land/tank_heavy_mortar/tank_heavy_mortar.json",
            "/pa/units/land/tank_hover/tank_hover.json",
            "/pa/units/land/tank_laser_adv/tank_laser_adv.json",
            "/pa/units/land/tank_light_laser/tank_light_laser.json",
            "/pa/units/land/tank_nuke/tank_nuke.json",
            "/pa/units/land/titan_bot/titan_bot.json",
            "/pa/units/land/titan_vehicle/titan_vehicle.json",
            "/pa/units/orbital/orbital_battleship/orbital_battleship.json",
            "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
            "/pa/units/orbital/orbital_fighter/orbital_fighter.json",
            "/pa/units/orbital/orbital_lander/orbital_lander.json",
            "/pa/units/orbital/orbital_laser/orbital_laser.json",
            "/pa/units/orbital/orbital_probe/orbital_probe.json",
            "/pa/units/orbital/orbital_railgun/orbital_railgun.json",
            "/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json",
            "/pa/units/orbital/radar_satellite/radar_satellite.json",
            "/pa/units/orbital/solar_array/solar_array.json",
            "/pa/units/orbital/titan_orbital/titan_orbital.json",
            "/pa/units/sea/attack_sub/attack_sub.json",
            "/pa/units/sea/battleship/battleship.json",
            "/pa/units/sea/destroyer/destroyer.json",
            "/pa/units/sea/drone_carrier/carrier/carrier.json",
            "/pa/units/sea/drone_carrier/drone/drone.json",
            "/pa/units/sea/fabrication_barge/fabrication_barge.json",
            "/pa/units/sea/fabrication_ship_adv/fabrication_ship_adv.json",
            "/pa/units/sea/fabrication_ship/fabrication_ship.json",
            "/pa/units/sea/frigate/frigate.json",
            "/pa/units/sea/hover_ship/hover_ship.json",
            "/pa/units/sea/missile_ship/missile_ship.json",
            "/pa/units/sea/nuclear_sub/nuclear_sub.json",
            "/pa/units/sea/sea_scout/sea_scout.json",
          ];
          units.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "navigation.move_speed",
                op: "multiply",
                value: 0.75,
              },
              {
                file: unit,
                path: "navigation.brake",
                op: "multiply",
                value: 0.75,
              },
              {
                file: unit,
                path: "navigation.acceleration",
                op: "multiply",
                value: 0.75,
              },
              {
                file: unit,
                path: "navigation.turn_speed",
                op: "multiply",
                value: 0.75,
              },
              {
                file: unit,
                path: "build_metal_cost",
                op: "multiply",
                value: 1.3,
              },
              {
                file: unit,
                path: "max_health",
                op: "multiply",
                value: 1.3,
              }
            );
          });
          var ammo = [
            "/pa/ammo/mine_pbaoe/mine_pbaoe.json",
            "/pa/units/air/bomber_adv/bomber_adv_ammo.json",
            "/pa/units/air/bomber_heavy/bomber_heavy_ammo.json",
            "/pa/units/air/bomber/bomber_ammo.json",
            "/pa/units/air/fighter_adv/fighter_adv_ammo.json",
            "/pa/units/air/fighter/fighter_ammo.json",
            "/pa/units/air/gunship/gunship_ammo.json",
            "/pa/units/air/solar_drone/solar_drone_ammo.json",
            "/pa/units/air/strafer/strafer_ammo.json",
            "/pa/units/air/titan_air/titan_air_ammo.json",
            "/pa/units/land/aa_missile_vehicle/aa_missile_vehicle_ammo.json",
            "/pa/units/land/air_defense_adv/air_defense_adv_ammo.json",
            "/pa/units/land/air_defense/air_defense_ammo.json",
            "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher_ammo.json",
            "/pa/units/land/artillery_long/artillery_long_ammo.json",
            "/pa/units/land/artillery_short/artillery_short_ammo.json",
            "/pa/units/land/assault_bot_adv/assault_bot_adv_ammo.json",
            "/pa/units/land/assault_bot/assault_bot_ammo.json",
            "/pa/units/land/bot_aa/bot_aa_ammo.json",
            "/pa/units/land/bot_bomb/bot_bomb_ammo.json",
            "/pa/units/land/bot_nanoswarm/bot_nanoswarm_ammo.json",
            "/pa/units/land/bot_sniper/bot_sniper_ammo.json",
            "/pa/units/land/bot_support_commander/bot_support_commander_ammo.json",
            "/pa/units/land/bot_tactical_missile/bot_tactical_missile_ammo.json",
            "/pa/units/land/bot_tesla/bot_tesla_ammo.json",
            "/pa/units/land/land_scout/land_scout_ammo.json",
            "/pa/units/land/laser_defense_adv/laser_defense_adv_ammo.json",
            "/pa/units/land/laser_defense_single/laser_defense_single_ammo.json",
            "/pa/units/land/laser_defense/laser_defense_ammo.json",
            "/pa/units/land/nuke_launcher/nuke_launcher_ammo.json",
            "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher_ammo.json",
            "/pa/units/land/tank_armor/tank_armor_ammo.json",
            "/pa/units/land/tank_flak/tank_flak_ammo.json",
            "/pa/units/land/tank_heavy_armor/tank_heavy_armor_ammo.json",
            "/pa/units/land/tank_hover/tank_hover_ammo.json",
            "/pa/units/land/tank_laser_adv/tank_laser_adv_ammo.json",
            "/pa/units/land/tank_light_laser/tank_light_laser_ammo.json",
            "/pa/units/land/titan_bot/titan_bot_ammo_stomp.json",
            "/pa/units/land/titan_vehicle/titan_vehicle_ammo_main.json",
            "/pa/units/land/titan_vehicle/titan_vehicle_ammo_side.json",
            "/pa/units/land/titan_vehicle/titan_vehicle_ammo_stomp.json",
            "/pa/units/orbital/defense_satellite/defense_satellite_ammo_ground.json",
            "/pa/units/orbital/defense_satellite/defense_satellite_ammo_orbital.json",
            "/pa/units/orbital/ion_defense/ion_defense_ammo.json",
            "/pa/units/orbital/orbital_battleship/orbital_battleship_ammo_ground.json",
            "/pa/units/orbital/orbital_fighter/orbital_fighter_ammo.json",
            "/pa/units/orbital/orbital_laser/orbital_laser_ammo.json",
            "/pa/units/orbital/orbital_railgun/orbital_railgun_ammo.json",
            "/pa/units/sea/attack_sub/attack_sub_ammo.json",
            "/pa/units/sea/battleship/battleship_ammo.json",
            "/pa/units/sea/destroyer/destroyer_ammo.json",
            "/pa/units/sea/destroyer/destroyer_torpedo_ammo.json",
            "/pa/units/sea/drone_carrier/drone/drone_ammo_torpedo.json",
            "/pa/units/sea/drone_carrier/drone/drone_ammo.json",
            "/pa/units/sea/frigate/frigate_ammo_aa.json",
            "/pa/units/sea/frigate/frigate_ammo_shell.json",
            "/pa/units/sea/frigate/frigate_ammo_torpedo.json",
            "/pa/units/sea/hover_ship/hover_ship_ammo_side.json",
            "/pa/units/sea/hover_ship/hover_ship_ammo.json",
            "/pa/units/sea/missile_ship/missile_ship_aa_ammo.json",
            "/pa/units/sea/missile_ship/missile_ship_ammo.json",
            "/pa/units/sea/nuclear_sub/nuclear_sub_ammo_missile.json",
            "/pa/units/sea/nuclear_sub/nuclear_sub_ammo.json",
            "/pa/units/sea/sea_scout/sea_scout_ammo.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo_land.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo_water.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo.json",
            "/pa/units/sea/torpedo_launcher/torpedo_launcher_ammo_land.json",
            "/pa/units/sea/torpedo_launcher/torpedo_launcher_ammo_water.json",
            "/pa/units/sea/torpedo_launcher/torpedo_launcher_ammo.json",
          ];
          ammo.forEach(function (ammo) {
            mods.push(
              {
                file: ammo,
                path: "damage",
                op: "multiply",
                value: 1.3,
              },
              {
                file: ammo,
                path: "splash_damage",
                op: "multiply",
                value: 1.3,
              }
            );
          });
          var structures = [
            "/pa/units/air/air_factory_adv/air_factory_adv.json",
            "/pa/units/air/air_factory/air_factory.json",
            "/pa/units/land/air_defense_adv/air_defense_adv.json",
            "/pa/units/land/air_defense/air_defense.json",
            "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher.json",
            "/pa/units/land/artillery_long/artillery_long.json",
            "/pa/units/land/artillery_short/artillery_short.json",
            "/pa/units/land/bot_factory_adv/bot_factory_adv.json",
            "/pa/units/land/bot_factory/bot_factory.json",
            "/pa/units/land/control_module/control_module.json",
            "/pa/units/land/energy_plant_adv/energy_plant_adv.json",
            "/pa/units/land/energy_plant/energy_plant.json",
            "/pa/units/land/energy_storage/energy_storage.json",
            "/pa/units/land/land_barrier/land_barrier.json",
            "/pa/units/land/land_mine/land_mine.json",
            "/pa/units/land/laser_defense_adv/laser_defense_adv.json",
            "/pa/units/land/laser_defense_single/laser_defense_single.json",
            "/pa/units/land/laser_defense/laser_defense.json",
            "/pa/units/land/metal_extractor_adv/metal_extractor_adv.json",
            "/pa/units/land/metal_extractor/metal_extractor.json",
            "/pa/units/land/metal_storage/metal_storage.json",
            "/pa/units/land/nuke_launcher/nuke_launcher.json",
            "/pa/units/land/radar_adv/radar_adv.json",
            "/pa/units/land/radar/radar.json",
            "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json",
            "/pa/units/land/teleporter/teleporter.json",
            "/pa/units/land/titan_structure/titan_structure.json",
            "/pa/units/land/unit_cannon/unit_cannon.json",
            "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json",
            "/pa/units/land/vehicle_factory/vehicle_factory.json",
            "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
            "/pa/units/orbital/defense_satellite/defense_satellite.json",
            "/pa/units/orbital/delta_v_engine/delta_v_engine.json",
            "/pa/units/orbital/ion_defense/ion_defense.json",
            "/pa/units/orbital/mining_platform/mining_platform.json",
            "/pa/units/orbital/orbital_factory/orbital_factory.json",
            "/pa/units/orbital/orbital_factory/orbital_factory.json",
            "/pa/units/orbital/orbital_launcher/orbital_launcher.json",
            "/pa/units/orbital/orbital_launcher/orbital_launcher.json",
            "/pa/units/sea/naval_factory_adv/naval_factory_adv.json",
            "/pa/units/sea/naval_factory/naval_factory.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
            "/pa/units/sea/torpedo_launcher/torpedo_launcher.json",
          ];
          structures.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "build_metal_cost",
                op: "multiply",
                value: 1.3,
              },
              {
                file: unit,
                path: "max_health",
                op: "multiply",
                value: 1.3,
              }
            );
          });
          inventory.addMods(mods);
        } else {
          inventory.maxCards(inventory.maxCards() + 1);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        gwaioBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
