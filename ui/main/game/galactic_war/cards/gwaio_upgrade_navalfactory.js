define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwaioCards, gwaioUnits, gwaioGroups) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Naval Factory Upgrade Tech enables the building of advanced units by basic naval manufacturing."
    ),
    summarize: _.constant("!LOC:Naval Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_sea",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        !inventory.hasCard("gwaio_start_rapid") &&
        gwaioCards.hasUnit(inventory.units(), gwaioUnits.navalFactory)
      ) {
        chance = 30;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwaioGroups.navalAdvancedMobile);

      inventory.addMods([
        {
          file: gwaioUnits.navalFactory,
          path: "buildable_types",
          op: "add",
          value: " | (Naval & Mobile & FactoryBuild)",
        },
      ]);

      var units = [
        "Battleship",
        "MissleShip",
        "MissileSub",
        "HoverShip",
        "DroneCarrier",
      ];
      var aiMods = _.flatten(
        _.map(units, function (unit) {
          return [
            {
              type: "factory",
              op: "append",
              toBuild: unit,
              idToMod: "builders",
              value: "BasicNavalFactory",
            },
            {
              type: "factory",
              op: "replace",
              toBuild: unit,
              idToMod: "priority",
              value: 97,
            },
          ];
        })
      );
      aiMods.push(
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedNavalFabber",
          idToMod: "builders",
          value: "BasicNavalFactory",
        },
        {
          type: "factory",
          op: "new",
          toBuild: "AdvancedNavalFabber",
          idToMod: "", // add to every test array
          value: {
            test_type: "HaveEcoForAdvanced",
            boolean: true,
          },
        }
      );
      inventory.addAIMods(aiMods);
    },
    dull: function () {
      //empty
    },
  };
});
