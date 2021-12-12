define(["shared/gw_common"], function (GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Defense Ammunition Tech increases damage of all defensive structures by 25%"
    ),
    summarize: _.constant("!LOC:Defense Ammunition Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_turret.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context) {
      var chance = 0;
      var dist = system.distance();
      if (dist > 0) {
        if (context.totalSize <= GW.balance.numberOfSystems[0]) {
          chance = 12;
        } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
          chance = 12;
        } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
          chance = 24;
          if (dist > 6) {
            chance = 120;
          }
        } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
          chance = 24;
          if (dist > 9) {
            chance = 120;
          }
        } else {
          chance = 24;
          if (dist > 12) {
            chance = 120;
          }
        }
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var ammos = [
        "/pa/ammo/mine_pbaoe/mine_pbaoe.json",
        "/pa/units/land/air_defense_adv/air_defense_adv_ammo.json",
        "/pa/units/land/air_defense/air_defense_ammo.json",
        "/pa/units/land/laser_defense_adv/laser_defense_adv_ammo.json",
        "/pa/units/land/laser_defense_single/laser_defense_single_ammo.json",
        "/pa/units/land/laser_defense/laser_defense_ammo.json",
        "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher_ammo.json",
        "/pa/units/orbital/defense_satellite/defense_satellite_ammo_ground.json",
        "/pa/units/orbital/defense_satellite/defense_satellite_ammo_orbital.json",
        "/pa/units/orbital/ion_defense/ion_defense_ammo.json",
        "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo_land.json",
        "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo_water.json",
        "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo.json",
        "/pa/units/sea/torpedo_launcher/torpedo_launcher_ammo_land.json",
        "/pa/units/sea/torpedo_launcher/torpedo_launcher_ammo_water.json",
        "/pa/units/sea/torpedo_launcher/torpedo_launcher_ammo.json",
      ];
      var mods = [];
      ammos.forEach(function (ammo) {
        mods.push({
          file: ammo,
          path: "damage",
          op: "multiply",
          value: 1.25,
        });
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
