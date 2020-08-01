define(["module", "shared/gw_common", "cards/gwc_start"], function (
  module,
  GW,
  GWCStart
) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Bionic Augmentation Commander Of Neutralizing"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/shared/img/red-commander.png"
    ),
    describe: _.constant(
      "!LOC:The Bionic Augmentation Commander Of Neutralizing loadout contains one data bank but increases the Commander's fire rate by 100%, decreases Uber Cannon energy usage by 75%, increases health by 200%, and increases speed by 650%."
    ),
    hint: function () {
      return {
        icon:
          "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
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
          inventory.maxCards(inventory.maxCards() - 2);
          var units = [
            "/pa/units/commanders/base_commander/base_commander.json",
          ];
          var mods = [];
          var modUnit = function (unit) {
            mods.push({
              file: unit,
              path: "navigation.move_speed",
              op: "multiply",
              value: 5.0,
            });
            mods.push({
              file: unit,
              path: "navigation.brake",
              op: "multiply",
              value: 5.0,
            });
            mods.push({
              file: unit,
              path: "navigation.acceleration",
              op: "multiply",
              value: 5.0,
            });
            mods.push({
              file: unit,
              path: "navigation.turn_speed",
              op: "multiply",
              value: 5.0,
            });
            mods.push({
              file: unit,
              path: "max_health",
              op: "multiply",
              value: 3.0,
            });
          };
          _.forEach(units, modUnit);
          var weaps = [
            "/pa/tools/uber_cannon/uber_cannon.json",
            "/pa/units/commanders/base_commander/base_commander_tool_weapon.json",
          ];
          var modWeap = function (weap) {
            mods.push({
              file: weap,
              path: "ammo_capacity",
              op: "multiply",
              value: 0.25,
            });
            mods.push({
              file: weap,
              path: "ammo_demand",
              op: "multiply",
              value: 0.25,
            });
            mods.push({
              file: weap,
              path: "ammo_per_shot",
              op: "multiply",
              value: 0.25,
            });
            mods.push({
              file: weap,
              path: "rate_of_fire",
              op: "multiply",
              value: 2.0,
            });
          };
          _.forEach(weaps, modWeap);
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
