define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Kaiju Upgrade Tech enables the use of teleporters by hover destroyers."
    ),
    summarize: _.constant("!LOC:Kaiju Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_speed",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        (gwaioCards.hasUnit(gwaioUnits.navalFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_navalfactory")) &&
        gwaioCards.hasUnit(gwaioUnits.kaiju)
      ) {
        chance = 30;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.kaiju,
          path: "teleportable",
          op: "replace",
          value: {},
        },
        {
          file: gwaioUnits.kaiju,
          path: "command_caps",
          op: "push",
          value: "ORDER_Use",
        },
      ]);

      var unitTypePrepend = "(Naval & Hover & Advanced & Mobile) | ";
      var unitTypes =
        "(Naval & Hover & Advanced & Mobile) - Fabber - AirDefense - OrbitalDefense - Construction - Artillery - Tactical - Heavy - Scout - SelfDestruct - Deconstruction - Titan";

      inventory.addAIMods([
        {
          type: "factory",
          op: "new",
          toBuild: "HoverShip",
          value: [
            {
              test_type: "AloneOnPlanet",
              boolean: true,
            },
            {
              test_type: "CanAffordBuildDemand",
            },
            {
              test_type: "OtherPlanetCanReceiveLandUnitAssistance",
              boolean: true,
            },
            {
              test_type: "UnitCountOnPlanet",
              unit_type_string0: "Structure & Teleporter",
              compare0: ">",
              value0: 0,
            },
          ],
        },
        {
          type: "platoon",
          op: "prepend",
          toBuild: "Land_Attack_XLarge",
          value: unitTypePrepend,
          idToMod: "unit_type_string0",
          refId: "test_type",
          refValue: "UnitPoolCount",
        },
        {
          type: "template",
          op: "squad",
          toBuild: "Land_Attack_XLarge",
          value: {
            unit_types: unitTypes,
            min_count: 0,
            max_count: 40,
            squad: "General",
          },
        },
        {
          type: "platoon",
          op: "prepend",
          toBuild: "Land_Attack_Max",
          value: unitTypePrepend,
          idToMod: "unit_type_string0",
          refId: "test_type",
          refValue: "UnitPoolCount",
        },
        {
          type: "template",
          op: "squad",
          toBuild: "Land_Attack_Max",
          value: {
            unit_types: unitTypes,
            min_count: 0,
            max_count: -1,
            squad: "General",
          },
        },
        {
          type: "platoon",
          op: "prepend",
          toBuild: "Teleporter_Attack_Queller",
          value: unitTypePrepend,
          idToMod: "unit_type_string0",
          refId: "test_type",
          refValue: "UnitPoolCount",
        },
        {
          type: "template",
          op: "squad",
          toBuild: "Teleporter_Attack_Queller",
          value: {
            unit_types: unitTypes,
            min_count: 0,
            max_count: -1,
            squad: "General",
          },
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
