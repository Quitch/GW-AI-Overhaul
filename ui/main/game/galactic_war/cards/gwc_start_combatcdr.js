define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "cards/gwaio_faction_cluster",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (module, GW, GWCStart, gwaioFactionCluster, gwaioFunctions) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Bionic Augmentation Commander Of Neutralizing"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The Bionic Augmentation Commander Of Neutralizing loadout contains one data bank but increases the Commander's fire rate by 100%, decreases Uber Cannon energy usage by 75%, increases health by 200%, and increases speed by 650%."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Bionic Augmentation Commander Of Neutralizing",
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
        // Make sure we only do the start buff/dull once
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          if (inventory.getTag("global", "playerFaction") === 4)
            gwaioFactionCluster.buff(inventory);
          inventory.maxCards(inventory.maxCards() - 2);
          var units = [
            "/pa/units/commanders/base_commander/base_commander.json",
          ];
          var mods = [];
          units.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "navigation.move_speed",
                op: "multiply",
                value: 5,
              },
              {
                file: unit,
                path: "navigation.brake",
                op: "multiply",
                value: 5,
              },
              {
                file: unit,
                path: "navigation.acceleration",
                op: "multiply",
                value: 5,
              },
              {
                file: unit,
                path: "navigation.turn_speed",
                op: "multiply",
                value: 5,
              },
              {
                file: unit,
                path: "max_health",
                op: "multiply",
                value: 3,
              }
            );
          });
          var weapons = [
            "/pa/tools/uber_cannon/uber_cannon.json",
            "/pa/units/commanders/base_commander/base_commander_tool_weapon.json",
          ];
          weapons.forEach(function (weapon) {
            mods.push(
              {
                file: weapon,
                path: "ammo_capacity",
                op: "multiply",
                value: 0.25,
              },
              {
                file: weapon,
                path: "ammo_demand",
                op: "multiply",
                value: 0.25,
              },
              {
                file: weapon,
                path: "ammo_per_shot",
                op: "multiply",
                value: 0.25,
              },
              {
                file: weapon,
                path: "rate_of_fire",
                op: "multiply",
                value: 2.0,
              }
            );
          });
          inventory.addMods(mods);
        } else {
          // Don't clog up a slot.
          inventory.maxCards(inventory.maxCards() + 1);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        // Don't clog up a slot.
        inventory.maxCards(inventory.maxCards() + 1);
        GW.bank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          // Perform dulls here

          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
