define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "cards/gwaio_faction_cluster",
], function (module, GWCStart, gwaioBank, gwaioFactionCluster) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Planetary Excavation Commander"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/shared/img/red-commander.png"
    ),
    describe: _.constant(
      "!LOC:Modifies Metal Extractors to allowing building them anywhere, at a cost to efficiency. Starts with basic vehicles."
    ),
    hint: function () {
      return {
        icon:
          "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Planetary Excavation Commander",
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
          inventory.addUnits([
            "/pa/units/land/vehicle_factory/vehicle_factory.json",
            "/pa/units/land/tank_light_laser/tank_light_laser.json",
            "/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json",
            "/pa/units/land/tank_armor/tank_armor.json",
            "/pa/units/land/tank_hover/tank_hover.json",
          ]);
          var costUnits = [
            "/pa/units/land/metal_extractor/metal_extractor.json",
          ];
          var mods = [];
          costUnits.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "build_metal_cost",
                op: "replace",
                value: 250,
              },
              {
                file: unit,
                path: "production.metal",
                op: "replace",
                value: 4,
              },
              {
                file: unit,
                path: "feature_requirements",
                op: "replace",
                value: "none",
              },
              {
                file: unit,
                path: "description",
                op: "replace",
                value:
                  "!LOC:Basic Manufacturing - This modified version of the Metal Extractor can be placed anywhere, but costs more and produces at a decreased rate. Cannot stack with the Advanced Metal Extractor. Produces metal.",
              }
            );
          });
          var units = [
            "/pa/units/land/metal_extractor_adv/metal_extractor_adv.json",
          ];
          units.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "build_metal_cost",
                op: "replace",
                value: 2000,
              },
              {
                file: unit,
                path: "production.metal",
                op: "replace",
                value: 15,
              },
              {
                file: unit,
                path: "feature_requirements",
                op: "replace",
                value: "none",
              },
              {
                file: unit,
                path: "description",
                op: "replace",
                value:
                  "!LOC:Advanced Manufacturing - This modified version of the Advanced Metal Extractor can be placed anywhere, but costs more and produces at a decreased rate. Cannot stack with the basic Metal Extractor. Produces metal.",
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
