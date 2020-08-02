define([
  "module",
  "shared/gw_common",
  "shared/gw_factions",
  "cards/gwc_start",
  "cards/gwaio_faction_hive",
], function (module, GW, GWFactions, GWCStart, gwaioFactionHive) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:General Commander"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/shared/img/red-commander.png"
    ),
    describe: _.constant(
      "!LOC:The General Commander loadout contains very limited mobile forces and only two data banks. However, the loadout comes with two Sub Commanders that accompany you into each battle."
    ),
    hint: function () {
      return {
        icon:
          "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:General Commander",
      };
    },
    getContext: function (_, inventory) {
      return {
        faction: inventory.getTag("global", "playerFaction") || 0,
      };
    },
    deal: function (__, context) {
      var minions = _.shuffle(GWFactions[context.faction].minions.slice(0));
      return {
        params: {
          minions: minions.slice(0, 2),
          allowOverflow: true,
        },
        chance: 0,
      };
    },
    buff: function (inventory, context) {
      if (inventory.lookupCard(CARD) === 0) {
        // Make sure we only do the start buff/dull once
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          if (localStorage.getItem("gwaio_player_faction") === "4")
            gwaioFactionHive.buff(inventory);
          inventory.maxCards(inventory.maxCards() - 1);
          inventory.addUnits([
            "/pa/units/land/vehicle_factory/vehicle_factory.json",
            "/pa/units/land/tank_light_laser/tank_light_laser.json",
          ]);
          // eslint-disable-next-line lodash/prefer-map
          _.forEach(context.minions, function (minion) {
            inventory.minions.push(minion);
          });
          var minionSpecs = _.compact(_.pluck(context.minions, "commander"));
          inventory.addUnits(minionSpecs);
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
