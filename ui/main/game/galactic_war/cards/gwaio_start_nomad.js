define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "cards/gwaio_faction_cluster",
], function (module, GWCStart, gwaioBank, gwaioFactionCluster) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Nomad Commander"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/shared/img/red-commander.png"
    ),
    describe: _.constant("Structures are mobile."),
    hint: function () {
      return {
        icon:
          "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Nomad Commander",
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
            gwaioFactionCluster.buff(inventory);
          var mods = [];
          var units = [
            "/pa/units/land/air_defense_adv/air_defense_adv.json",
            "/pa/units/land/air_defense/air_defense.json",
            "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher.json",
            "/pa/units/land/artillery_long/artillery_long.json",
            "/pa/units/land/artillery_short/artillery_short.json",
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
            "/pa/units/land/titan_structure/titan_structure.json",
            "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
            "/pa/units/orbital/defense_satellite/defense_satellite.json",
            "/pa/units/orbital/delta_v_engine/delta_v_engine.json",
            "/pa/units/orbital/ion_defense/ion_defense.json",
            "/pa/units/orbital/mining_platform/mining_platform.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
            "/pa/units/sea/torpedo_launcher/torpedo_launcher.json",
          ];
          units.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "navigation.move_speed",
                op: "multiply",
                value: 1,
              },
              {
                file: unit,
                path: "navigation.brake",
                op: "multiply",
                value: 1,
              },
              {
                file: unit,
                path: "navigation.acceleration",
                op: "multiply",
                value: 1,
              },
              {
                file: unit,
                path: "navigation.turn_speed",
                op: "multiply",
                value: 1,
              },
              {
                file: unit,
                path: "command_caps",
                op: "push",
                value: ["ORDER_Move", "ORDER_Patrol", "ORDER_Assist"],
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
