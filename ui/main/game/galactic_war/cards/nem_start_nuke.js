define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "cards/gwaio_faction_cluster",
], function (module, GWCStart, gwaioBank, gwaioFactionCluster) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Tactical Nuke Commander"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/shared/img/red-commander.png"
    ),
    describe: _.constant(
      "!LOC:Replaces conventional nukes with a new low-cost/low-yield variant and relies heavily on it for both offense and defence."
    ),
    hint: function () {
      return {
        icon:
          "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Tactical Nuke Commander",
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
          if (localStorage.getItem("gwaio_player_faction") === "4")
            gwaioFactionCluster.buff(inventory);
          inventory.addUnits([
            "/pa/units/land/nuke_launcher/nuke_launcher.json",
            "/pa/units/land/vehicle_factory/vehicle_factory.json",
            "/pa/units/land/tank_light_laser/tank_light_laser.json",
          ]);
          var costUnits = [
            "/pa/units/land/nuke_launcher/nuke_launcher_ammo.json",
            "/pa/units/land/nuke_launcher/nuke_launcher_inter_ammo.json",
          ];
          var mods = [];
          var modCostUnit = function (unit) {
            mods.push({
              file: unit,
              path: "build_metal_cost",
              op: "replace",
              value: 300,
            });
            mods.push({
              file: unit,
              path: "damage",
              op: "replace",
              value: 750,
            });
            mods.push({
              file: unit,
              path: "splash_damage",
              op: "replace",
              value: 750,
            });
            mods.push({
              file: unit,
              path: "full_damage_splash_radius",
              op: "replace",
              value: 50,
            });
            mods.push({
              file: unit,
              path: "splash_radius",
              op: "replace",
              value: 45,
            });
            mods.push({
              file: unit,
              path: "description",
              op: "replace",
              value:
                "!LOC:Tactical Nuke - Small nuke with low damage and small blast radius.",
            });
          };
          _.forEach(costUnits, modCostUnit);
          var ammos = ["/pa/units/land/nuke_launcher/nuke_launcher.json"];
          var modAmmo = function (ammo) {
            mods.push({
              file: ammo,
              path: "build_metal_cost",
              op: "replace",
              value: 2500,
            });
            mods.push({
              file: ammo,
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_FabBuild",
            });
            mods.push({
              file: ammo,
              path: "description",
              op: "replace",
              value:
                "!LOC:Tactical Nuke Launcher - Constructs low-cost/low-yield interplanetary tactical nukes.",
            });
          };
          _.forEach(ammos, modAmmo);
          var units = [
            "/pa/units/land/nuke_launcher/nuke_launcher_build_arm.json",
          ];
          var modUnit = function (unit) {
            mods.push({
              file: unit,
              path: "construction_demand.metal",
              op: "replace",
              value: 15,
            });
            mods.push({
              file: unit,
              path: "construction_demand.energy",
              op: "replace",
              value: 2250,
            });
          };
          _.forEach(units, modUnit);
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
          inventory.removeUnits([
            "/pa/units/land/laser_defense/laser_defense.json",
            "/pa/units/land/laser_defense_adv/laser_defense_adv.json",
            "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json",
            "/pa/units/land/air_defense_adv/air_defense_adv.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
            "/pa/units/orbital/defense_satellite/defense_satellite.json",
          ]);
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
