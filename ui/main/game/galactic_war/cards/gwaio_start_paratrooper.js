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
    summarize: _.constant("!LOC:Paratrooper Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Contains no basic factories, just Lobs and Unit Cannons built by the commander. Strike from the skies, brothers!"
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Paratrooper Commander",
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

          var units = [
            "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json",
            "/pa/units/land/unit_cannon/unit_cannon.json",
          ];
          var UnitCannonUnits = [
            "/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json",
            "/pa/units/land/assault_bot/assault_bot.json",
            "/pa/units/land/attack_vehicle/attack_vehicle.json",
            "/pa/units/land/bot_aa/bot_aa.json",
            "/pa/units/land/bot_bomb/bot_bomb.json",
            "/pa/units/land/bot_grenadier/bot_grenadier.json",
            "/pa/units/land/bot_tesla/bot_tesla.json",
            "/pa/units/land/fabrication_bot_combat/fabrication_bot_combat.json",
            "/pa/units/land/tank_light_laser/tank_light_laser.json",
          ];
          var allUnits = units.concat(UnitCannonUnits);
          inventory.addUnits(allUnits);

          var mods = _.map(units, function (unit) {
            return {
              file: unit,
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_CmdBuild",
            };
          });
          inventory.addMods(mods);

          inventory.addAIMods([
            {
              type: "factory",
              op: "append",
              toBuild: "UnitCannon",
              idToMod: "builders",
              value: "Commander",
            },
            {
              type: "factory",
              op: "append",
              toBuild: "UnitCannon",
              idToMod: "builders",
              value: "UberCommander",
            },
            {
              type: "factory",
              op: "append",
              toBuild: "MiniUnitCannon", // No AI uses this currently
              idToMod: "builders",
              value: "Commander",
            },
            {
              type: "factory",
              op: "append",
              toBuild: "MiniUnitCannon", // No AI uses this currently
              idToMod: "builders",
              value: "UberCommander",
            },
          ]);
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
