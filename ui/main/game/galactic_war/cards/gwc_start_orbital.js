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
    summarize: _.constant("!LOC:Orbital Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The Orbital Commander loadout contains all orbital units and factories."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Orbital Commander",
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
            "/pa/units/orbital/defense_satellite/defense_satellite.json",
            "/pa/units/orbital/mining_platform/mining_platform.json",
            "/pa/units/orbital/orbital_battleship/orbital_battleship.json",
            "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
            "/pa/units/orbital/orbital_factory/orbital_factory.json",
            "/pa/units/orbital/orbital_fighter/orbital_fighter.json",
            "/pa/units/orbital/orbital_laser/orbital_laser.json",
            "/pa/units/orbital/orbital_probe/orbital_probe.json",
            "/pa/units/orbital/orbital_railgun/orbital_railgun.json",
            "/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json",
            "/pa/units/orbital/radar_satellite/radar_satellite.json",
            "/pa/units/orbital/solar_array/solar_array.json",
          ]);
          inventory.addMods([
            {
              file: "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_CmdBuild",
            },
            {
              file: "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
              path: "buildable_types",
              op: "replace",
              value: "FabBuild | FabOrbBuild",
            },
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

          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
