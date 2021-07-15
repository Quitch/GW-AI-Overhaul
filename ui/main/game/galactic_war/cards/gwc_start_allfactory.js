define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/tech.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (module, GW, GWCStart, gwaioTech, gwaioFunctions) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Assault Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The Assault Commander loadout contains all basic factories and units but no basic defenses."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Assault Commander",
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
            inventory.addMods(gwaioTech.clusterCommanders);
          inventory.addUnits([
            "/pa/units/air/air_factory/air_factory.json",
            "/pa/units/air/air_scout/air_scout.json",
            "/pa/units/air/bomber/bomber.json",
            "/pa/units/air/fighter/fighter.json",
            "/pa/units/air/solar_drone/solar_drone.json",
            "/pa/units/air/transport/transport.json",
            "/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json",
            "/pa/units/land/assault_bot/assault_bot.json",
            "/pa/units/land/attack_vehicle/attack_vehicle.json",
            "/pa/units/land/bot_aa/bot_aa.json",
            "/pa/units/land/bot_bomb/bot_bomb.json",
            "/pa/units/land/bot_factory/bot_factory.json",
            "/pa/units/land/bot_grenadier/bot_grenadier.json",
            "/pa/units/land/bot_tesla/bot_tesla.json",
            "/pa/units/land/fabrication_bot_combat/fabrication_bot_combat.json",
            "/pa/units/land/tank_armor/tank_armor.json",
            "/pa/units/land/tank_hover/tank_hover.json",
            "/pa/units/land/tank_light_laser/tank_light_laser.json",
            "/pa/units/land/vehicle_factory/vehicle_factory.json",
          ]);
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
          inventory.removeUnits([
            "/pa/units/land/air_defense/air_defense.json",
            "/pa/units/land/land_barrier/land_barrier.json",
            "/pa/units/land/laser_defense_single/laser_defense_single.json",
            "/pa/units/land/laser_defense/laser_defense.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
            "/pa/units/sea/torpedo_launcher/torpedo_launcher.json",
          ]);
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
