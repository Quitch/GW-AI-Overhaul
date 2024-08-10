define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Air Factory Upgrade Tech enables the building of advanced units by basic air manufacturing."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Air Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_air",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        !inventory.hasCard("gwaio_start_rapid") &&
        gwoCard.hasUnit(inventory.units(), gwoUnit.airFactory)
      ) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      const newUnits = gwoGroup.starterUnitsAdvanced.concat(
        gwoGroup.airAdvancedMobile
      );
      inventory.addUnits(newUnits);

      inventory.addMods([
        {
          file: gwoUnit.airFactory,
          path: "buildable_types",
          op: "add",
          value: " | (Air & Mobile & FactoryBuild & Custom58)",
        },
      ]);

      const units = [
        "AdvancedBomber",
        "AdvancedGunship",
        "AdvancedFighter",
        "Strafer",
      ];
      const aiMods = _.flatten(
        _.map(units, function (unit) {
          return [
            {
              type: "factory",
              op: "append",
              toBuild: unit,
              idToMod: "builders",
              value: "BasicAirFactory",
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
      aiMods.push([
        {
          type: "factory",
          op: "load",
          value: "gwaio_upgrade_airfactory.json",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedAirFabber",
          idToMod: "builders",
          value: "BasicAirFactory",
        },
        {
          type: "factory",
          op: "new",
          toBuild: "AdvancedAirFabber",
          idToMod: "", // add to every test array
          value: {
            test_type: "HaveEcoForAdvanced",
            boolean: true,
          },
        },
      ]);
      inventory.addAIMods(aiMods);
    },
    dull: function () {},
  };
});
